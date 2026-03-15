export const COMMAND_CATEGORIES = [
  { id: 'text', name: 'Text Processing', icon: 'FileText' },
  { id: 'file', name: 'File Management', icon: 'Folder' },
  { id: 'system', name: 'System & Process', icon: 'Cpu' },
  { id: 'network', name: 'Networking', icon: 'Globe' },
];

export const COMMAND_LIST = [
  // Text Processing
  { id: 'grep', name: 'grep', description: 'Search for patterns in text', category: 'text' },
  { id: 'sed', name: 'sed', description: 'Stream editor for filtering and transforming text', category: 'text' },
  { id: 'awk', name: 'awk', description: 'Pattern scanning and processing language', category: 'text' },
  { id: 'cut', name: 'cut', description: 'Remove sections from each line of files', category: 'text' },
  { id: 'sort', name: 'sort', description: 'Sort lines of text files', category: 'text' },
  { id: 'uniq', name: 'uniq', description: 'Report or omit repeated lines', category: 'text' },
  { id: 'tr', name: 'tr', description: 'Translate or delete characters', category: 'text' },
  { id: 'wc', name: 'wc', description: 'Print newline, word, and byte counts', category: 'text' },
  { id: 'printf', name: 'printf', description: 'Format and print data', category: 'text' },
  
  // File Management
  { id: 'find', name: 'find', description: 'Search for files in a directory', category: 'file' },
  { id: 'ls', name: 'ls', description: 'List directory contents', category: 'file' },
  { id: 'cat', name: 'cat', description: 'Concatenate and print files', category: 'file' },
  { id: 'cp', name: 'cp', description: 'Copy files and directories', category: 'file' },
  { id: 'mv', name: 'mv', description: 'Move (rename) files', category: 'file' },
  { id: 'rm', name: 'rm', description: 'Remove files or directories', category: 'file' },
  { id: 'chmod', name: 'chmod', description: 'Change file mode bits', category: 'file' },
  { id: 'chown', name: 'chown', description: 'Change file owner and group', category: 'file' },
  { id: 'tar', name: 'tar', description: 'Manipulate tape archives', category: 'file' },
  { id: 'gzip', name: 'gzip', description: 'Compress or expand files', category: 'file' },
  
  // System & Process
  { id: 'ps', name: 'ps', description: 'Report current processes', category: 'system' },
  { id: 'top', name: 'top', description: 'Display Linux processes', category: 'system' },
  { id: 'kill', name: 'kill', description: 'Send a signal to a process', category: 'system' },
  { id: 'df', name: 'df', description: 'Report disk space usage', category: 'system' },
  { id: 'du', name: 'du', description: 'Estimate file space usage', category: 'system' },
  { id: 'lsof', name: 'lsof', description: 'List open files', category: 'system' },
  { id: 'uptime', name: 'uptime', description: 'Tell how long the system has been running', category: 'system' },
  { id: 'free', name: 'free', description: 'Display amount of free and used memory', category: 'system' },
  
  // Networking
  { id: 'curl', name: 'curl', description: 'Transfer data from or to a server', category: 'network' },
  { id: 'ssh', name: 'ssh', description: 'OpenSSH SSH client', category: 'network' },
  { id: 'scp', name: 'scp', description: 'Secure copy (remote file copy)', category: 'network' },
  { id: 'netstat', name: 'netstat', description: 'Print network connections', category: 'network' },
  { id: 'ping', name: 'ping', description: 'Send ICMP ECHO_REQUEST to network hosts', category: 'network' },
  { id: 'dig', name: 'dig', description: 'DNS lookup utility', category: 'network' },
];

export const APP_THEME = {
  bg: 'bg-[#0a0a0a]',
  terminalBg: 'bg-[#121212]',
  text: 'text-emerald-500',
  accent: 'text-emerald-400',
  border: 'border-emerald-900/30',
  fontMono: 'font-mono',
};
