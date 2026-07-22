const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const map = {
  // Backgrounds
  'bg-[#0A0B0E]': 'bg-primary',
  'bg-[#181A20]': 'bg-primary',
  'bg-[#12141C]': 'bg-secondary',
  'bg-[#1A1D28]': 'bg-tertiary',
  
  // Texts
  'text-[#F8FAFC]': 'text-content',
  'text-[#E2E8F0]': 'text-content',
  'text-[#94A3B8]': 'text-muted',
  'text-[#64748B]': 'text-muted',
  'text-[#8E9BAE]': 'text-muted',
  'text-[#D4AF37]': 'text-gold-500',
  'placeholder-[#64748B]': 'placeholder-muted',
  'placeholder-[#8E9BAE]': 'placeholder-muted',
  
  // Borders
  'border-white/10': 'border-border',
  'border-[#D4AF37]': 'border-gold-500',
  
  // Hovers
  'hover:text-[#F8FAFC]': 'hover:text-content',
  'hover:text-[#D4AF37]': 'hover:text-gold-500',
  'hover:border-white/20': 'hover:border-border/50',
  'hover:border-white/25': 'hover:border-border/50',
  'hover:border-white/30': 'hover:border-border/50',
  'hover:bg-[#181A20]': 'hover:bg-tertiary',
  'hover:bg-white/5': 'hover:bg-black/5 dark:hover:bg-white/5',
  
  // Focus
  'focus:border-[#D4AF37]': 'focus:border-gold-500',
};

const files = walkSync(path.join(__dirname, 'src', 'pages'));

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [key, value] of Object.entries(map)) {
    // We use split and join to replace all instances safely
    content = content.split(key).join(value);
  }

  // Handle special cases with opacities like bg-[#12141C]/80 -> bg-secondary/80
  // Since Tailwind doesn't allow CSS var opacity directly via `/` unless configured,
  // we might need to be careful. However, mapping to bg-secondary/80 works if secondary is defined via <alpha-value>.
  // In tailwind.config.js we mapped `secondary: 'var(--bg-secondary)'`.
  // Wait, `bg-secondary/80` won't work unless `var(--bg-secondary)` is an rgb format.
  // Since we defined `--bg-secondary: #FFFFFF`, `bg-secondary/80` might not apply opacity natively in Tailwind 3 without an RGB definition.
  // Let's strip the alpha and just rely on the variable, or leave it as is if it breaks.
  // Actually, we'll replace `bg-[#12141C]/80` with `bg-secondary opacity-80`.
  content = content.replace(/bg-\[#12141C\]\/80/g, 'bg-secondary opacity-80');
  content = content.replace(/bg-\[#12141C\]\/60/g, 'bg-secondary opacity-60');
  content = content.replace(/bg-\[#12141C\]\/50/g, 'bg-secondary opacity-50');
  content = content.replace(/bg-\[#0A0B0E\]\/50/g, 'bg-primary opacity-50');
  content = content.replace(/bg-\[#0A0B0E\]\/40/g, 'bg-primary opacity-40');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated colors in ${file}`);
    totalReplaced++;
  }
});

console.log(`Finished replacing colors in ${totalReplaced} files.`);
