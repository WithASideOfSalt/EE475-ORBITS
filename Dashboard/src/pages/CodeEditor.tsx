import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import '../Styleing/CodeEditor.css';

interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
}

export default function CodeEditor({ code, setCode }: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  // Define custom Arduino blocks
  const defineArduinoBlocks = () => {
    // Arduino setup block
    Blockly.Blocks['arduino_setup'] = {
      init: function() {
        this.appendStatementInput("SETUP")
            .setCheck(null)
            .appendField("setup");
        this.setColour(230);
        this.setTooltip("Arduino setup function");
        this.setDeletable(false);
      }
    };

    (javascriptGenerator as any).forBlock['arduino_setup'] = function(block: any, generator: any) {
      const statements = generator.statementToCode(block, 'SETUP');
      return statements;
    };

    // Arduino loop block
    Blockly.Blocks['arduino_loop'] = {
      init: function() {
        this.appendStatementInput("LOOP")
            .setCheck(null)
            .appendField("loop");
        this.setColour(230);
        this.setTooltip("Arduino loop function");
        this.setDeletable(false);
      }
    };

    (javascriptGenerator as any).forBlock['arduino_loop'] = function(block: any, generator: any) {
      const statements = generator.statementToCode(block, 'LOOP');
      return statements;
    };

    // pinMode block
    Blockly.Blocks['arduino_pin_mode'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("pinMode")
            .appendField(new Blockly.FieldNumber(13, 0, 53), "PIN")
            .appendField(new Blockly.FieldDropdown([["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]]), "MODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Configure pin mode");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_pin_mode'] = function(block: any) {
      const pin = block.getFieldValue('PIN');
      const mode = block.getFieldValue('MODE');
      return `pinMode(${pin}, ${mode});\n`;
    };

    // digitalWrite block
    Blockly.Blocks['arduino_digital_write'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("digitalWrite")
            .appendField(new Blockly.FieldNumber(13, 0, 53), "PIN")
            .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "VALUE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Write digital value to pin");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_digital_write'] = function(block: any) {
      const pin = block.getFieldValue('PIN');
      const value = block.getFieldValue('VALUE');
      return `digitalWrite(${pin}, ${value});\n`;
    };

    // digitalRead block
    Blockly.Blocks['arduino_digital_read'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("digitalRead")
            .appendField(new Blockly.FieldNumber(13, 0, 53), "PIN");
        this.setOutput(true, "Number");
        this.setColour(160);
        this.setTooltip("Read digital value from pin");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_digital_read'] = function(block: any) {
      const pin = block.getFieldValue('PIN');
      return [`digitalRead(${pin})`, (javascriptGenerator as any).ORDER_FUNCTION_CALL];
    };

    // analogWrite block
    Blockly.Blocks['arduino_analog_write'] = {
      init: function() {
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField("analogWrite")
            .appendField(new Blockly.FieldNumber(9, 0, 53), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Write analog value (PWM) to pin");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_analog_write'] = function(block: any, generator: any) {
      const pin = block.getFieldValue('PIN');
      const value = generator.valueToCode(block, 'VALUE', (javascriptGenerator as any).ORDER_ATOMIC) || '0';
      return `analogWrite(${pin}, ${value});\n`;
    };

    // analogRead block
    Blockly.Blocks['arduino_analog_read'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("analogRead")
            .appendField(new Blockly.FieldNumber(0, 0, 7), "PIN");
        this.setOutput(true, "Number");
        this.setColour(160);
        this.setTooltip("Read analog value from pin");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_analog_read'] = function(block: any) {
      const pin = block.getFieldValue('PIN');
      return [`analogRead(${pin})`, (javascriptGenerator as any).ORDER_FUNCTION_CALL];
    };

    // delay block
    Blockly.Blocks['arduino_delay'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("delay")
            .appendField(new Blockly.FieldNumber(1000, 0), "TIME")
            .appendField("ms");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Delay in milliseconds");
      }
    };

    (javascriptGenerator as any).forBlock['arduino_delay'] = function(block: any) {
      const time = block.getFieldValue('TIME');
      return `delay(${time});\n`;
    };

    // Serial.begin block
    Blockly.Blocks['serial_begin'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Serial.begin")
            .appendField(new Blockly.FieldDropdown([["9600", "9600"], ["115200", "115200"], ["57600", "57600"]]), "BAUD");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Initialize serial communication");
      }
    };

    (javascriptGenerator as any).forBlock['serial_begin'] = function(block: any) {
      const baud = block.getFieldValue('BAUD');
      return `Serial.begin(${baud});\n`;
    };

    // Serial.print block
    Blockly.Blocks['serial_print'] = {
      init: function() {
        this.appendValueInput("TEXT")
            .setCheck(null)
            .appendField("Serial.print");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Print to serial");
      }
    };

    (javascriptGenerator as any).forBlock['serial_print'] = function(block: any, generator: any) {
      const text = generator.valueToCode(block, 'TEXT', (javascriptGenerator as any).ORDER_ATOMIC) || '""';
      return `Serial.print(${text});\n`;
    };

    // Serial.println block
    Blockly.Blocks['serial_println'] = {
      init: function() {
        this.appendValueInput("TEXT")
            .setCheck(null)
            .appendField("Serial.println");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Print line to serial");
      }
    };

    (javascriptGenerator as any).forBlock['serial_println'] = function(block: any, generator: any) {
      const text = generator.valueToCode(block, 'TEXT', (javascriptGenerator as any).ORDER_ATOMIC) || '""';
      return `Serial.println(${text});\n`;
    };
  };

  // Generate Arduino code from Blockly workspace
  const generateArduinoCode = (workspace: Blockly.WorkspaceSvg): string => {
    let setupCode = '';
    let loopCode = '';
    
    const blocks = workspace.getAllBlocks(false);
    
    // Find setup and loop blocks
    const setupBlock = blocks.find(b => b.type === 'arduino_setup');
    const loopBlock = blocks.find(b => b.type === 'arduino_loop');
    
    // Generate code for setup block
    if (setupBlock) {
      setupCode = (javascriptGenerator as any).blockToCode(setupBlock, javascriptGenerator) || '';
      setupCode = setupCode.trim();
    }
    
    // Generate code for loop block
    if (loopBlock) {
      loopCode = (javascriptGenerator as any).blockToCode(loopBlock, javascriptGenerator) || '';
      loopCode = loopCode.trim();
    }
    
    // Add proper indentation
    const indentCode = (code: string): string => {
      if (!code) return '  ';
      return code.split('\n').map(line => line ? `  ${line}` : '').join('\n');
    };

    return `#include <Arduino.h>\n\nvoid setup() {\n${indentCode(setupCode)}\n}\n\nvoid loop() {\n${indentCode(loopCode)}\n}\n`;
  };

  // Initialize Blockly workspace
  useEffect(() => {
    if (blocklyDivRef.current && !workspaceRef.current) {
      const toolbox = {
        kind: 'categoryToolbox',
        contents: [
          {
            kind: 'category',
            name: 'Arduino',
            colour: '#5C81A6',
            contents: [
              { kind: 'block', type: 'arduino_setup' },
              { kind: 'block', type: 'arduino_loop' },
              { kind: 'block', type: 'arduino_pin_mode' },
              { kind: 'block', type: 'arduino_digital_write' },
              { kind: 'block', type: 'arduino_digital_read' },
              { kind: 'block', type: 'arduino_analog_write' },
              { kind: 'block', type: 'arduino_analog_read' },
              { kind: 'block', type: 'arduino_delay' },
            ],
          },
          {
            kind: 'category',
            name: 'Serial',
            colour: '#A65C81',
            contents: [
              { kind: 'block', type: 'serial_begin' },
              { kind: 'block', type: 'serial_print' },
              { kind: 'block', type: 'serial_println' },
            ],
          },
          {
            kind: 'category',
            name: 'Logic',
            colour: '#5C68A6',
            contents: [
              { kind: 'block', type: 'controls_if' },
              { kind: 'block', type: 'logic_compare' },
              { kind: 'block', type: 'logic_operation' },
              { kind: 'block', type: 'logic_boolean' },
            ],
          },
          {
            kind: 'category',
            name: 'Loops',
            colour: '#5CA68D',
            contents: [
              { kind: 'block', type: 'controls_repeat_ext' },
              { kind: 'block', type: 'controls_whileUntil' },
              { kind: 'block', type: 'controls_for' },
            ],
          },
          {
            kind: 'category',
            name: 'Math',
            colour: '#5CA65C',
            contents: [
              { kind: 'block', type: 'math_number' },
              { kind: 'block', type: 'math_arithmetic' },
              { kind: 'block', type: 'math_single' },
            ],
          },
          {
            kind: 'category',
            name: 'Variables',
            colour: '#A6635C',
            custom: 'VARIABLE',
          },
        ],
      };

      workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
        toolbox: toolbox as any,
        move: {
          scrollbars: true,
          drag: true,
          wheel: false
        },
        grid: {
          spacing: 20,
          length: 1,
          colour: '#888',
          snap: true  // Force blocks to snap to grid
        },
        zoom: {
          controls: true,
          wheel: false,
          startScale: 1.0,
          maxScale: 2,
          minScale: 0.5,
          scaleSpeed: 1.1
        },
        trashcan: true,
        comments: false,
        disable: false,
        collapse: false,
        sounds: false,
        // CRITICAL: Enforce structure
        maxInstances: {
          'arduino_setup': 1,  // Only one setup function
          'arduino_loop': 1    // Only one loop function
        },
        // Prevent random placement
        horizontalLayout: false,
        toolboxPosition: 'start'
      });

      // Define custom Arduino blocks
      defineArduinoBlocks();

      // Add default setup and loop blocks
      const setupBlock = workspaceRef.current.newBlock('arduino_setup');
      setupBlock.moveBy(20, 20);
      setupBlock.initSvg();
      setupBlock.render();

      const loopBlock = workspaceRef.current.newBlock('arduino_loop');
      loopBlock.moveBy(20, 150);
      loopBlock.initSvg();
      loopBlock.render();

      // Listen for changes and generate code
      workspaceRef.current.addChangeListener(() => {
        if (workspaceRef.current) {
          const generatedCode = generateArduinoCode(workspaceRef.current);
          setCode(generatedCode);
        }
      });

      // Generate initial code
      const initialCode = generateArduinoCode(workspaceRef.current);
      setCode(initialCode);
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [setCode]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    monacoRef.current = monaco;
    
    // Register C++/Arduino completion provider
    monaco.languages.register({ id: 'cpp' });
    
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          // Arduino-specific functions
          { label: 'pinMode', kind: monaco.languages.CompletionItemKind.Function, insertText: 'pinMode(${1:pin}, ${2:mode})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Configure pin mode' },
          { label: 'digitalWrite', kind: monaco.languages.CompletionItemKind.Function, insertText: 'digitalWrite(${1:pin}, ${2:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Write digital value' },
          { label: 'digitalRead', kind: monaco.languages.CompletionItemKind.Function, insertText: 'digitalRead(${1:pin})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Read digital value' },
          { label: 'analogWrite', kind: monaco.languages.CompletionItemKind.Function, insertText: 'analogWrite(${1:pin}, ${2:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Write analog value (PWM)' },
          { label: 'analogRead', kind: monaco.languages.CompletionItemKind.Function, insertText: 'analogRead(${1:pin})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Read analog value' },
          { label: 'delay', kind: monaco.languages.CompletionItemKind.Function, insertText: 'delay(${1:milliseconds})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Delay in milliseconds' },
          { label: 'delayMicroseconds', kind: monaco.languages.CompletionItemKind.Function, insertText: 'delayMicroseconds(${1:microseconds})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Delay in microseconds' },
          { label: 'millis', kind: monaco.languages.CompletionItemKind.Function, insertText: 'millis()', detail: 'Get milliseconds since start' },
          { label: 'micros', kind: monaco.languages.CompletionItemKind.Function, insertText: 'micros()', detail: 'Get microseconds since start' },
          
          // Serial communication
          { label: 'Serial.begin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Serial.begin(${1:9600})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Initialize serial' },
          { label: 'Serial.print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Serial.print(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Print to serial' },
          { label: 'Serial.println', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Serial.println(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Print line to serial' },
          { label: 'Serial.read', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Serial.read()', detail: 'Read from serial' },
          { label: 'Serial.available', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Serial.available()', detail: 'Check serial availability' },
          
          // Pin modes
          { label: 'INPUT', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'INPUT', detail: 'Input pin mode' },
          { label: 'OUTPUT', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'OUTPUT', detail: 'Output pin mode' },
          { label: 'INPUT_PULLUP', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'INPUT_PULLUP', detail: 'Input with pullup resistor' },
          { label: 'HIGH', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'HIGH', detail: 'Logic high' },
          { label: 'LOW', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'LOW', detail: 'Logic low' },
          
          // C++ keywords
          { label: 'void', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'void' },
          { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int' },
          { label: 'float', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'float' },
          { label: 'char', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'char' },
          { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'bool' },
          { label: 'const', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'const' },
          
          // Control structures
          { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < 10}; ${3:i++}) {\n\t${4}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          
          // Standard functions
          { label: 'setup', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void setup() {\n\t${1}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Arduino setup function' },
          { label: 'loop', kind: monaco.languages.CompletionItemKind.Function, insertText: 'void loop() {\n\t${1}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'Arduino loop function' },
        ];

        return { suggestions };
      },
      triggerCharacters: ['.'],
    });

    // Register hover provider for documentation
    monaco.languages.registerHoverProvider('cpp', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const docs: Record<string, string> = {
          'pinMode': 'Configures the specified pin to behave either as an input or an output.\n\nSyntax: pinMode(pin, mode)',
          'digitalWrite': 'Write a HIGH or a LOW value to a digital pin.\n\nSyntax: digitalWrite(pin, value)',
          'digitalRead': 'Reads the value from a specified digital pin, either HIGH or LOW.\n\nSyntax: digitalRead(pin)',
          'analogWrite': 'Writes an analog value (PWM wave) to a pin.\n\nSyntax: analogWrite(pin, value)',
          'analogRead': 'Reads the value from the specified analog pin.\n\nSyntax: analogRead(pin)',
          'delay': 'Pauses the program for the amount of time (in milliseconds) specified.\n\nSyntax: delay(ms)',
          'millis': 'Returns the number of milliseconds since the program started.\n\nSyntax: millis()',
          'Serial': 'Used for communication between the Arduino board and a computer or other devices.',
          'setup': 'The setup() function is called when a sketch starts. Use it to initialize variables, pin modes, start using libraries, etc.',
          'loop': 'The loop() function loops consecutively, allowing your program to change and respond.',
        };

        const doc = docs[word.text];
        if (doc) {
          return {
            contents: [
              { value: `**${word.text}**` },
              { value: doc }
            ]
          };
        }
        return null;
      },
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Blockly Workspace */}
      <div 
        ref={blocklyDivRef} 
        style={{ 
          width: '50%', 
          height: '100%',
          borderRight: '1px solid #ccc',
        }} 
      />
      
      {/* Monaco Editor */}
      <div style={{ width: '50%', height: '100%' }}>
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: true },
            fontSize: 16,
            wordWrap: 'on',
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
}
