const os = require('os');
const { exec } = require('child_process');

let lastCpuInfo = null;

function getCpuUsage() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  if (!lastCpuInfo) {
    lastCpuInfo = { idle, total };
    return 0;
  }

  const idleDiff = idle - lastCpuInfo.idle;
  const totalDiff = total - lastCpuInfo.total;
  lastCpuInfo = { idle, total };

  if (totalDiff === 0) return 0;
  const usage = 100 - Math.round((100 * idleDiff) / totalDiff);
  return Math.min(100, Math.max(0, usage));
}

function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const cpuPercent = getCpuUsage();

  return {
    cpu: {
      percent: cpuPercent,
      model: os.cpus()[0]?.model || 'CPU',
      cores: os.cpus().length
    },
    memory: {
      usedGB: (usedMem / 1024 / 1024 / 1024).toFixed(1),
      totalGB: (totalMem / 1024 / 1024 / 1024).toFixed(1),
      percent: memPercent
    },
    uptime: formatUptime(os.uptime()),
    platform: os.platform(),
    hostname: os.hostname(),
    username: os.userInfo().username
  };
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${m}м`;
}

function getGitStatus(cwd) {
  return new Promise((resolve) => {
    exec('git rev-parse --abbrev-ref HEAD', { cwd, timeout: 2000 }, (err, branch) => {
      if (err || !branch.trim()) {
        resolve({ isRepo: false });
        return;
      }

      exec('git status --porcelain', { cwd, timeout: 2000 }, (statusErr, statusOut) => {
        const lines = statusOut ? statusOut.trim().split('\n').filter(Boolean) : [];
        resolve({
          isRepo: true,
          branch: branch.trim(),
          changesCount: lines.length
        });
      });
    });
  });
}

module.exports = {
  getSystemMetrics,
  getGitStatus
};
