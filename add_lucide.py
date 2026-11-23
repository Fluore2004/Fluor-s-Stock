import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  RotateCcw\n} from 'lucide-react';", "  RotateCcw,\n  Printer,\n  QrCode,\n  X\n} from 'lucide-react';")

with open('src/App.tsx', 'w') as f:
    f.write(content)
