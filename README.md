# DATABASE HACKED BY INFINITY X

OSINT training lab — **web** + **Kali / WSL terminal tool**.

Live site: https://infinityosint.netlify.app

Search: **name · CNIC · mobile · invoice · city · business · NADRA**

---

## Kali Linux / WSL (this is what you need)

On Kali you were in `~` — the folder **does not exist** until you clone GitHub.

```bash
sudo apt update
sudo apt install -y git python3
git clone https://github.com/Infinity-X202/infinityx-osint-lab.git
cd infinityx-osint-lab/kali-linux
bash install.sh
source ~/.zshrc 2>/dev/null || source ~/.bashrc
infinityx
```

No sudo? `bash install.sh` still works (installs to `~/.local`).

Without installing:

```bash
cd infinityx-osint-lab/kali-linux
bash run.sh
# or
python3 infinityx.py
python3 infinityx.py search "MUHAMMAD ASLAM"
python3 infinityx.py search 3320213987869
```

### WSL (Windows)

Same clone. Do **not** `cd kali-linux` from home unless you cloned there.

Windows files are here (only if the project is already on Desktop):

```bash
cd "/mnt/c/Users/adilf/Desktop/pakistan database hacked white devels teams/kali-linux"
bash install.sh
```

---

## Web app

```bash
npm install
npm run dev
```

---

Authorized OSINT training environment.
