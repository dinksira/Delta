export interface RichTextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  label?: string;
  error?: string;
}
