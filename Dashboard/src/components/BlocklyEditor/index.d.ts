import { FC } from 'react';

export interface BlocklyEditorProps {
  onCodeChange?: (code: string) => void;
}

declare const BlocklyEditor: FC<BlocklyEditorProps>;
export default BlocklyEditor;
