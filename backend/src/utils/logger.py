"""Logging configuration."""

import logging
import os


def get_logger(name: str) -> logging.Logger:
    """Return a module-specific logger."""
    logger = logging.getLogger(name)
    level = os.getenv("LOG_LEVEL", "INFO")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger
