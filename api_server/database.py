import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "coderiq.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            title TEXT NOT NULL,
            source_files TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            language TEXT,
            name TEXT NOT NULL,
            category TEXT,
            difficulty TEXT,
            what TEXT,
            why TEXT,
            snippet TEXT,
            highlight_lines TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            snippet TEXT,
            choices TEXT NOT NULL,
            correct_index INTEGER NOT NULL,
            explanation TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS fill_in_the_blank (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            instruction TEXT NOT NULL,
            code TEXT NOT NULL,
            blanks TEXT NOT NULL,
            explanation TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            question_type TEXT NOT NULL,
            answered_at TEXT NOT NULL,
            was_correct INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            score INTEGER,
            total_questions INTEGER,
            content_types TEXT
        );
    """)

    # Migrate existing DB — add columns if they don't exist
    for col, definition in [("language", "TEXT"), ("highlight_lines", "TEXT")]:
        try:
            cur.execute(f"ALTER TABLE concepts ADD COLUMN {col} {definition}")
        except sqlite3.OperationalError:
            pass  # column already exists

    conn.commit()
    conn.close()
