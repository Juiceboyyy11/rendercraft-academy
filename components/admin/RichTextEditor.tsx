'use client'

import { useState, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  Underline,
  Strikethrough,
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Code,
  Palette,
  Type,
  Minus,
  Plus
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const [history, setHistory] = useState<string[]>([content])
  const [historyIndex, setHistoryIndex] = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)

  const saveToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      saveToHistory(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      executeCommand('createLink', url)
    }
  }

  const changeFontSize = (size: string) => {
    executeCommand('fontSize', size)
  }

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #ff0000 or red):')
    if (color) {
      executeCommand('foreColor', color)
    }
  }

  const insertHorizontalRule = () => {
    executeCommand('insertHorizontalRule')
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex]
      }
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex]
      }
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      saveToHistory(editorRef.current.innerHTML)
    }
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-white/10 transition-colors ${
        isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-white/20 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/10">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={() => executeCommand('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => executeCommand('underline')}
            title="Underline"
          >
            <Underline size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => executeCommand('strikeThrough')}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'h1')}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'h2')}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'h3')}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
        </div>

        {/* Lists & Structure */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'blockquote')}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => executeCommand('formatBlock', 'pre')}
            title="Code Block"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={() => executeCommand('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('justifyRight')}
            title="Align Right"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => executeCommand('justifyFull')}
            title="Justify"
          >
            <AlignJustify size={16} />
          </ToolbarButton>
        </div>

        {/* Font & Color */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={() => changeFontSize('3')}
            title="Small Text"
          >
            <Type size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => changeFontSize('4')}
            title="Normal Text"
          >
            <Type size={18} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => changeFontSize('5')}
            title="Large Text"
          >
            <Type size={20} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={changeTextColor}
            title="Text Color"
          >
            <Palette size={16} />
          </ToolbarButton>
        </div>

        {/* Links & Elements */}
        <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
          <ToolbarButton
            onClick={insertLink}
            title="Insert Link"
          >
            <Link size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={insertHorizontalRule}
            title="Horizontal Line"
          >
            <Minus size={16} />
          </ToolbarButton>
        </div>

        {/* History */}
        <div className="flex items-center space-x-1">
          <ToolbarButton
            onClick={undo}
            title="Undo"
          >
            <Undo size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={redo}
            title="Redo"
          >
            <Redo size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[200px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="prose prose-invert max-w-none focus:outline-none min-h-[150px]"
          style={{ 
            color: 'rgb(255 255 255 / 0.8)',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: content }}
          data-placeholder={placeholder}
        />
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgb(255 255 255 / 0.5);
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}