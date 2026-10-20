# One Braincell Heist

A tiny turn-based stealth puzzle game built with Flask, HTML, CSS, and JavaScript.

## The premise

Three thieves share one brain cell. You can move only one thief per turn, and every action advances the guards. Use each thief's unique ability to reach the vault and escape.

- **Hex** (Hacker): hack a nearby electronic door.
- **Misdirect** (Distractor): lure nearby guards toward a decoy.
- **Swipe** (Pickpocket): steal a key when standing next to it.
- **Shared brain cell:** only one thief acts each turn.
- **Guard turns:** guards move after each successful action.
- **Win:** collect the key, open the vault door, and get a thief to the vault tile.

## Run locally

Requires Python 3.10+.

```bash
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

## Run with Docker

```bash
docker build -t one-braincell-heist .
docker run --rm -p 5000:5000 one-braincell-heist
```

Then open http://localhost:5000.

## Controls

1. Click a thief card to select a character.
2. Click an adjacent tile to move.
3. Use that character's ability button when in range.
4. Use **Restart heist** to reset the level.

This is a small hackathon prototype. The game state is held in the browser while the Flask app serves the page; refreshing resets the level.
