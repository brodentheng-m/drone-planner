export function parseDroneScript(text) {
  const rawLines = text.split('\n');
  const processed = [];

  for (let raw of rawLines) {
    const stripped = raw.replace(/\t/g, '    ');
    const indent = stripped.length - stripped.trimStart().length;
    const content = stripped.trim();
    processed.push({ indent, content });
  }

  function parseLevel(startIdx, endIndent) {
    const cmds = [];
    let i = startIdx;

    while (i < processed.length) {
      const { indent, content } = processed[i];

      if (indent < endIndent) break;
      if (indent > endIndent) { i++; continue; }
      if (!content || content.startsWith('#') || content.startsWith('from ') || content.startsWith('import ')) { i++; continue; }

      const cmd = parseLine(content);
      if (cmd) {
        if (cmd.type === 'if_block' || cmd.type === 'elif_block' || cmd.type === 'else_block' ||
            cmd.type === 'while_block' || cmd.type === 'for_block' || cmd.type === 'func_def') {
          i++;
          cmd.children = parseLevel(i, indent + 4);
          while (i < processed.length && processed[i].indent >= indent + 4) i++;
          while (i < processed.length && (!processed[i].content || processed[i].content.startsWith('#'))) i++;
          if (i < processed.length && processed[i].indent === indent) {
            const nextContent = processed[i].content;
            if (cmd.type === 'if_block' && (nextContent.startsWith('elif ') || nextContent.startsWith('else:'))) continue;
            if (cmd.type === 'elif_block' && (nextContent.startsWith('elif ') || nextContent.startsWith('else:'))) continue;
          }
        } else {
          i++;
        }
        cmds.push(cmd);
      } else {
        i++;
      }
    }
    return cmds;
  }

  return parseLevel(0, 0);
}

function parseLine(line) {
  let m;

  if ((m = line.match(/^if\s+(.+):$/))) return { type: 'if_block', params: { condition: m[1] }, children: [] };
  if ((m = line.match(/^elif\s+(.+):$/))) return { type: 'elif_block', params: { condition: m[1] }, children: [] };
  if (line === 'else:') return { type: 'else_block', params: {}, children: [] };
  if ((m = line.match(/^while\s+(.+):$/))) return { type: 'while_block', params: { condition: m[1] }, children: [] };
  if ((m = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\s*,\s*(\d+)\s*,\s*(-?\d+)\)$/))) {
    return { type: 'for_block', params: { var: m[1], start: parseInt(m[2]), end_val: parseInt(m[3]), step: parseInt(m[4]) }, children: [] };
  }
  if ((m = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\s*,\s*(\d+)\)$/))) {
    return { type: 'for_block', params: { var: m[1], start: parseInt(m[2]), end_val: parseInt(m[3]), step: 1 }, children: [] };
  }
  if ((m = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\)$/))) {
    return { type: 'for_block', params: { var: m[1], start: 0, end_val: parseInt(m[2]), step: 1 }, children: [] };
  }
  if (line === 'break') return { type: 'break_cmd', params: {} };

  if ((m = line.match(/^def\s+(\w+)\(\):$/))) return { type: 'func_def', params: { name: m[1] }, children: [] };
  if ((m = line.match(/^(\w+)\(\)$/))) return { type: 'func_call', params: { name: m[1] } };
  if ((m = line.match(/^return\s+(.+)$/))) return { type: 'return_val', params: { value: m[1] } };

  if ((m = line.match(/^(\w+)\s*=\s*(.+)$/))) return { type: 'var_declare', params: { name: m[1], value: m[2] } };
  if ((m = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/))) return { type: 'set_var', params: { name: m[1], op: m[2], value: m[3] } };
  if ((m = line.match(/^print\((.+)\)$/))) return { type: 'print_var', params: { value: m[1] } };

  if ((m = line.match(/^(\w+)\s*=\s*\[(.+)\]$/))) return { type: 'list_declare', params: { name: m[1], values: m[2] } };
  if ((m = line.match(/^(\w+)\.append\((.+)\)$/))) return { type: 'list_append', params: { name: m[1], value: m[2] } };
  if ((m = line.match(/^(\w+)\s*=\s*(\w+)\[(.+)\]$/))) return { type: 'list_get', params: { var: m[1], list_name: m[2], index: m[3] } };

  if ((m = line.match(/^(\w+)\s*=\s*time\.time\(\)$/))) return { type: 'timer_start', params: { name: m[1] } };
  if ((m = line.match(/^(\w+)\s*=\s*time\.time\(\)\s*-\s*(\w+)$/))) return { type: 'timer_elapsed', params: { var: m[1], name: m[2] } };
  if ((m = line.match(/^time\.sleep\((.+)\)$/))) return { type: 'time_sleep', params: { dur: parseFloat(m[1]) || 1 } };

  if ((m = line.match(/drone\.takeoff\(\)/))) return { type: 'takeoff', params: {} };
  if ((m = line.match(/drone\.land\(\)/))) return { type: 'land', params: {} };
  if ((m = line.match(/drone\.hover\((.+)\)/))) return { type: 'hover', params: { dur: parseFloat(m[1]) || 1 } };
  if ((m = line.match(/drone\.flip\(["'](\w+)["']\)/))) return { type: 'flip', params: { dir: m[1] } };
  if ((m = line.match(/drone\.go\(["'](\w+)["']\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/))) {
    return { type: 'go', params: { dir: m[1], power: parseInt(m[2]) || 50, dur: parseFloat(m[3]) || 1 } };
  }
  if ((m = line.match(/drone\.move_forward\((\d+)(?:\s*,\s*(\d+))?\)/))) {
    return { type: 'move_forward', params: { dist: parseFloat(m[1]) || 50, power: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_backward\((\d+)(?:\s*,\s*(\d+))?\)/))) {
    return { type: 'move_backward', params: { dist: parseFloat(m[1]) || 50, power: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_left\((\d+)(?:\s*,\s*(\d+))?\)/))) {
    return { type: 'move_left', params: { dist: parseFloat(m[1]) || 50, power: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_right\((\d+)(?:\s*,\s*(\d+))?\)/))) {
    return { type: 'move_right', params: { dist: parseFloat(m[1]) || 50, power: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.turn_left\((.+)\)/))) return { type: 'turn_left', params: { deg: parseInt(m[1]) || 90 } };
  if ((m = line.match(/drone\.turn_right\((.+)\)/))) return { type: 'turn_right', params: { deg: parseInt(m[1]) || 90 } };
  if ((m = line.match(/drone\.circle\(\)/))) return { type: 'circle', params: {} };
  if ((m = line.match(/drone\.square\(\)/))) return { type: 'square', params: {} };
  if ((m = line.match(/drone\.triangle\(\)/))) return { type: 'triangle', params: {} };

  if ((m = line.match(/drone\.set_led\(["'](\w+)["']\)/))) return { type: 'led', params: { color: m[1] } };
  if ((m = line.match(/drone\.set_buzzer\((\d+)\s*,\s*([\d.]+)\)/))) return { type: 'buzzer', params: { freq: parseInt(m[1]), dur: parseFloat(m[2]) } };
  if ((m = line.match(/drone\.random_color\(\)/))) return { type: 'random_led', params: {} };

  if ((m = line.match(/(\w+)\s*=\s*drone\.get_distance\(\)/))) return { type: 'get_distance', params: { var: m[1] } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_height\(\)/))) return { type: 'get_height', params: { var: m[1] } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_color\(\)/))) return { type: 'get_color', params: { var: m[1] } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_battery\(\)/))) return { type: 'get_battery', params: { var: m[1] } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_temperature\(\)/))) return { type: 'get_temperature', params: { var: m[1] } };

  return null;
}
