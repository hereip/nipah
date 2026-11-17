// Standalone Node.js PTY worker to guarantee node-pty works without ABI conflicts
const pty = require('node-pty');
const os = require('os');
const fs = require('fs');
const readline = require('readline');

const sessions = new Map();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', (line) => {
  try {
    const packet = JSON.parse(line);
    const { action, id, data, cols, rows, cwd } = packet;

    if (action === 'create') {
      const shell = process.env.SHELL || 'powershell.exe';
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: cwd || os.homedir(),
        env: process.env
      });

      sessions.set(id, ptyProcess);

      ptyProcess.onData((output) => {
        send({ event: 'data', id, data: output });
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        send({ event: 'exit', id, exitCode, signal });
        sessions.delete(id);
      });

      send({ event: 'created', id, pid: ptyProcess.pid });
    } else if (action === 'write') {
      const proc = sessions.get(id);
      if (proc) proc.write(data);
    } else if (action === 'resize') {
      const proc = sessions.get(id);
      if (proc && cols > 0 && rows > 0) {
        try {
          proc.resize(cols, rows);
        } catch (e) {
          // ignore resize errors if process exited
        }
      }
    } else if (action === 'kill') {
      const proc = sessions.get(id);
      if (proc) {
        proc.kill();
        sessions.delete(id);
      }
    }
  } catch (err) {
    send({ event: 'error', error: err.message });
  }
});

process.on('SIGTERM', () => {
  for (const proc of sessions.values()) {
    try { proc.kill(); } catch (e) {}
  }
  process.exit(0);
});
