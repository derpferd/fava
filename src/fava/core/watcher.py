"""A simple file and folder watcher."""
from __future__ import annotations

from os import stat
from os import walk
import queue
from typing import Iterable, Optional, Set
import os
import sys
import threading
import time
import logging
from typing import Callable

import inotify.adapters


class Watcher:
    """A simple file and folder watcher.

    For folders, only checks mtime of the folder and all subdirectories.
    So a file change won't be noticed, but only new/deleted files.
    """

    __slots__ = [
        "_files",
        "_folders",
        "last_checked",
        "last_modified_time",
        "change_condition",
        "update_thread",
        "update_thread_queue",
    ]

    def __init__(self) -> None:
        self._files: list[str] = []
        self._folders: list[str] = []
        self.last_checked = 0
        self.last_modified_time = time.time_ns()
        self.change_condition = threading.Condition()
        self.update_thread: Optional[threading.Thread] = None
        self.update_thread_queue: queue.Queue[Set[str]] = queue.Queue()

    def path_filter(self, path: str) -> bool:
        if path in self._files:
            return True
        for folder in self._folders:
            if path.startswith(folder):
                return True
        return False

    def update(self, files: Iterable[str], folders: Iterable[str]) -> None:
        """Update the folders/files to watch.

        Args:
            files: A list of file paths.
            folders: A list of paths to folders.
        """
        self._files = list(files)
        self._folders = list(folders)
        self.check()

        def update_func() -> None:
            i = inotify.adapters.InotifyTrees(
                list(
                    {f for f in folders if os.path.exists(f)}
                    | {os.path.dirname(x) for x in files}
                )
            )
            while True:
                try:
                    update = self.update_thread_queue.get_nowait()
                except queue.Empty:
                    ...
                else:
                    i = inotify.adapters.InotifyTrees(list(update))

                for event in i.event_gen(yield_nones=False, timeout_s=1):
                    (_, type_names, path, filename) = event
                    type_name = type_names[0]
                    if type_name in {
                        "IN_OPEN",
                        "IN_ACCESS",
                        "IN_CLOSE_NOWRITE",
                    }:
                        continue
                    if self.path_filter(path + "/" + filename):
                        self.last_modified_time = time.time_ns()
                        with self.change_condition:
                            self.change_condition.notify_all()

                        print(
                            "PATH=[{}] FILENAME=[{}] EVENT_TYPES={}".format(
                                path, filename, type_names
                            )
                        )

        self.update_thread_queue.put(
            {f for f in folders if os.path.exists(f)}
            | {os.path.dirname(x) for x in files}
        )
        if not self.update_thread:
            print("Starting Update Thread")
            self.update_thread = threading.Thread(
                target=update_func, daemon=True
            )
            self.update_thread.start()

    def wait_for_next_change(self, timeout_seconds: float) -> None:
        with self.change_condition:
            self.change_condition.wait(timeout=timeout_seconds)

    def get_latest_mtime(self) -> int:
        return self.last_modified_time

    def check(self) -> bool:
        """Check for changes.

        Returns:
            `True` if there was a file change in one of the files or folders,
            `False` otherwise.
        """

        latest_mtime = self.get_latest_mtime()
        changed = bool(latest_mtime != self.last_checked)
        self.last_checked = latest_mtime
        return changed
