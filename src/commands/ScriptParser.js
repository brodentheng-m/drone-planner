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
  if ((m = line.match(/drone\.emergency_stop\(\)/))) return { type: 'emergency_stop', params: {} };
  if ((m = line.match(/drone\.stop_motors\(\)/))) return { type: 'stop_motors', params: {} };
  if ((m = line.match(/drone\.hover\((.+)\)/))) return { type: 'hover', params: { dur: parseFloat(m[1]) || 1 } };
  if ((m = line.match(/drone\.flip\(["'](\w+)["']\)/))) return { type: 'flip', params: { dir: m[1] } };
  if ((m = line.match(/drone\.go\(["'](\w+)["']\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/))) {
    return { type: 'go', params: { dir: m[1], power: parseInt(m[2]) || 50, dur: parseFloat(m[3]) || 1 } };
  }
  if ((m = line.match(/drone\.move_forward\((\d+)(?:\s*,\s*speed=(\d+))?\)/))) {
    return { type: 'move_forward', params: { dist: parseFloat(m[1]) || 50, speed: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_backward\((\d+)(?:\s*,\s*speed=(\d+))?\)/))) {
    return { type: 'move_backward', params: { dist: parseFloat(m[1]) || 50, speed: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_left\((\d+)(?:\s*,\s*speed=(\d+))?\)/))) {
    return { type: 'move_left', params: { dist: parseFloat(m[1]) || 50, speed: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.move_right\((\d+)(?:\s*,\s*speed=(\d+))?\)/))) {
    return { type: 'move_right', params: { dist: parseFloat(m[1]) || 50, speed: parseInt(m[2]) || 50 } };
  }
  if ((m = line.match(/drone\.turn_left\((.+)\)/))) return { type: 'turn_left', params: { deg: parseInt(m[1]) || 90 } };
  if ((m = line.match(/drone\.turn_right\((.+)\)/))) return { type: 'turn_right', params: { deg: parseInt(m[1]) || 90 } };
  if ((m = line.match(/drone\.turn_degree\(([^,]+)(?:\s*,\s*timeout=([^,]+))?(?:\s*,\s*p_value=([^,]+))?\)/))) {
    return { type: 'turn_degree', params: { deg: parseInt(m[1]) || 90, timeout: parseFloat(m[2]) || 3, p_value: parseInt(m[3]) || 10 } };
  }
  if ((m = line.match(/drone\.circle\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'circle', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 75, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.circle_turn\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'circle_turn', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 75, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.square\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const secsMatch = args.match(/seconds=([\d.]+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'square', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 60, secs: secsMatch ? parseFloat(secsMatch[1]) : 1, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.square_turn\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const secsMatch = args.match(/seconds=([\d.]+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'square_turn', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 60, secs: secsMatch ? parseFloat(secsMatch[1]) : 1, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.triangle\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const secsMatch = args.match(/seconds=([\d.]+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'triangle', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 60, secs: secsMatch ? parseFloat(secsMatch[1]) : 1, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.triangle_turn\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const secsMatch = args.match(/seconds=([\d.]+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'triangle_turn', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 60, secs: secsMatch ? parseFloat(secsMatch[1]) : 1, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.spiral\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const directionMatch = args.match(/direction=(-?\d+|clockwise|counter-clockwise)/);
    return { type: 'spiral', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 50, dir: directionMatch ? (directionMatch[1] === '-1' || directionMatch[1] === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise') : 'clockwise' } };
  }
  if ((m = line.match(/drone\.sway\(([^)]*)\)/))) {
    const args = m[1];
    const speedMatch = args.match(/speed=(\d+)/);
    const dirMatch = args.match(/direction=["']?([^"']+)["']?/);
    return { type: 'sway', params: { speed: speedMatch ? parseInt(speedMatch[1]) : 50, dir: dirMatch ? dirMatch[1] : 'forward-back' } };
  }
  if ((m = line.match(/drone\.keep_distance\(([^)]*)\)/))) {
    const args = m[1].split(',').map(a => a.trim());
    return { type: 'keep_distance', params: { dist: parseFloat(args[0]) || 50, speed: parseInt(args[1]) || 50 } };
  }
  if ((m = line.match(/drone\.avoid_wall\(([^)]*)\)/))) {
    const args = m[1].split(',').map(a => a.trim());
    return { type: 'avoid_wall', params: { dist: parseFloat(args[0]) || 50, speed: parseInt(args[1]) || 50 } };
  }
  if ((m = line.match(/(\w+)\s*=\s*drone\.detect_wall\(\)/))) return { type: 'detect_wall', params: { var: m[1] } };

  if ((m = line.match(/drone\.set_led\(["'](\w+)["']\)/))) {
    return { type: 'led', params: { color: m[1] || 'green' } };
  }
  if (line === 'drone.set_led("off")' || line === "drone.set_led('off')") return { type: 'led_off', params: {} };
  if (line === 'drone.random_color()') return { type: 'random_led', params: {} };
  if ((m = line.match(/drone\.set_buzzer\((\d+)\s*,\s*([\d.]+)\)/))) {
    return { type: 'buzzer', params: { freq: parseInt(m[1]) || 440, dur: parseFloat(m[2]) || 0.5 } };
  }
  if ((m = line.match(/drone\.set_drone_LED\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+))?\)/))) {
    return { type: 'led', params: { r: parseInt(m[1]) || 0, g: parseInt(m[2]) || 255, b: parseInt(m[3]) || 0, brightness: parseInt(m[4]) || 100 } };
  }
  if (line === 'drone.drone_LED_off()') return { type: 'led_off', params: {} };
  if ((m = line.match(/drone\.drone_buzzer\(([^,]+)\s*,\s*(\d+)\)/))) {
    return { type: 'buzzer', params: { note: m[1], dur: parseInt(m[2]) || 500 } };
  }

  if ((m = line.match(/(\w+)\s*=\s*drone\.get_battery\(\)/))) return { type: 'get_battery', params: { var: m[1] } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_height\([^)]*\)/))) return { type: 'get_height', params: { var: m[1], unit: 'cm' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_front_range\([^)]*\)/))) return { type: 'get_front_range', params: { var: m[1], unit: 'cm' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_bottom_range\([^)]*\)/))) return { type: 'get_bottom_range', params: { var: m[1], unit: 'cm' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_front_color\([^)]*\)/))) return { type: 'get_front_color', params: { var: m[1], kind: 'name' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_back_color\([^)]*\)/))) return { type: 'get_back_color', params: { var: m[1], kind: 'name' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_temperature\([^)]*\)/))) return { type: 'get_temperature', params: { var: m[1], unit: 'C' } };
  if ((m = line.match(/(\w+)\s*=\s*drone\.get_distance\([^)]*\)/))) return { type: 'get_front_range', params: { var: m[1], unit: 'cm' } };

  return null;
}
