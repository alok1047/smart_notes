import { createElement } from 'react';
import { SiNotion, SiYoutube } from '@icons-pack/react-simple-icons';
import {
  Image as ImageIcon,
  Mic,
  NotebookPen,
} from 'lucide-react';
import pdfLogo from '../assets/pdf-logo.png';

const YoutubeIcon = (props) => createElement(SiYoutube, props);
const NotionIcon = (props) => createElement(SiNotion, props);

const PdfLogoIcon = (props) => {
  const { size = 20 } = props;
  return createElement('img', {
    src: pdfLogo,
    width: size,
    height: size,
    style: { objectFit: 'contain', backgroundColor: 'transparent' },
    alt: '',
  });
};

export const SOURCES = [
  {
    id: 'pdf',
    title: 'PDF',
    description: 'Turn lecture slides and documents into structured notes.',
    flow: 'Lecture slides → structured notes',
    support: 'PDF · 15 MB max',
    icon: PdfLogoIcon,
    bg: 'transparent',
    color: '#E0554D',
    panel: 'pastel',
  },
  {
    id: 'youtube',
    title: 'YouTube',
    description: 'Paste a lecture URL and extract timestamped knowledge.',
    flow: 'Lecture video → transcript → notes',
    support: 'youtube.com / youtu.be',
    icon: YoutubeIcon,
    bg: '#FFFFFF',
    color: '#FF0000',
    panel: 'lavender',
  },
  {
    id: 'raw',
    title: 'Raw Notes',
    description: 'Paste messy notes and let AI organize them.',
    flow: 'Messy text → organized knowledge',
    support: 'text · paste or type',
    icon: NotebookPen,
    bg: '#6B6760',
    color: '#FFFFFF',
    panel: 'warm',
  },
  {
    id: 'notion',
    title: 'Notion',
    description: 'Import a Notion page into your knowledge base.',
    flow: 'Documents → connected knowledge',
    support: 'page link · pasted content',
    icon: NotionIcon,
    bg: '#FFFFFF',
    color: '#000000',
    panel: 'mint',
  },
  {
    id: 'recording',
    title: 'Lecture Recording',
    description: 'Transcribe and structure your lecture.',
    flow: 'Audio → transcript → notes',
    support: 'MP3 · WAV · M4A · WEBM',
    icon: Mic,
    bg: '#F04858',
    color: '#FFFFFF',
    panel: 'cyan',
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Extract handwritten or visual notes with OCR.',
    flow: 'Handwritten notes → structured knowledge',
    support: 'PNG · JPG · WEBP',
    icon: ImageIcon,
    bg: '#FDF2D8',
    color: '#2ABFAB',
    panel: 'peach',
  },
];
