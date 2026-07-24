const TAKEOFF_HEIGHT = 0.8;
const FLIP_RADIUS_H = 0.35;
const FLIP_RADIUS_V = 0.45;
const DEFAULT_SPEED = 0.5;
const DT = 0.05;
const MAX_PITCH = 25;
const MAX_ROLL = 25;
const FLIP_PITCH_MAX = 45;

function pos(x, y, z, heading, pitch = 0, roll = 0, led) {
  const p = { x, y, z, heading, pitch, roll };
  if (led !== undefined) p.led = led;
  return p;
}

function replaceVars(expr, vars) {
  let result = expr;
  const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const name of varNames) {
    result = result.replace(new RegExp('\\b' + name + '\\b', 'g'), JSON.stringify(vars[name]));
  }
  return result;
}

function evalExpr(expr, vars) {
  try {
    const replaced = replaceVars(expr, vars);
    return Function('"use strict"; return (' + replaced + ')')();
  } catch { return 0; }
}

function processCommands(commands, vars, state, maxIter = 500) {
  let iter = 0;
  for (const cmd of commands) {
    if (iter++ > maxIter) break;
    const p = cmd.params || {};
    let dur = 0;

    switch (cmd.type) {
      case 'takeoff': {
        const steps = Math.max(Math.ceil(TAKEOFF_HEIGHT / (DEFAULT_SPEED * DT)), 10);
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          state.z = TAKEOFF_HEIGHT * t;
          const pitch = t < 0.5 ? -MAX_PITCH * (1 - t * 2) : 0;
          state.positions.push(pos(state.x, state.y, state.z, state.heading, pitch, 0));
        }
        state.flying = true;
        dur = steps * DT;
        break;
      }
      case 'land': {
        const startZ = state.z;
        const steps = Math.max(Math.ceil(startZ / (DEFAULT_SPEED * DT)), 10);
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          state.z = startZ * (1 - t);
          const pitch = t > 0.5 ? MAX_PITCH * ((t - 0.5) * 2) : 0;
          state.positions.push(pos(state.x, state.y, state.z, state.heading, pitch, 0));
        }
        state.flying = false;
        state.z = 0;
        dur = steps * DT;
        break;
      }
      case 'hover': {
        dur = parseFloat(p.dur) || 1;
        const steps = Math.ceil(dur / DT);
        for (let i = 0; i < steps; i++)
          state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'flip': {
        const dir = p.dir || 'back';
        const numPoints = 40;
        const hr = state.heading * Math.PI / 180;
        const hx = state.x, hy = state.y, hz = state.z;
        for (let i = 0; i < numPoints; i++) {
          const t = i / numPoints;
          const angle = 2 * Math.PI * t;
          let fx = hx, fy = hy, fz = hz;
          if (dir === 'back') { fx -= FLIP_RADIUS_H * Math.sin(angle) * Math.cos(hr); fy -= FLIP_RADIUS_H * Math.sin(angle) * Math.sin(hr); fz += FLIP_RADIUS_V * (1 - Math.cos(angle)); }
          else if (dir === 'forward') { fx += FLIP_RADIUS_H * Math.sin(angle) * Math.cos(hr); fy += FLIP_RADIUS_H * Math.sin(angle) * Math.sin(hr); fz += FLIP_RADIUS_V * (1 - Math.cos(angle)); }
          else if (dir === 'left') { fx -= FLIP_RADIUS_H * Math.sin(angle) * Math.sin(hr); fy += FLIP_RADIUS_H * Math.sin(angle) * Math.cos(hr); fz += FLIP_RADIUS_V * (1 - Math.cos(angle)); }
          else { fx += FLIP_RADIUS_H * Math.sin(angle) * Math.sin(hr); fy -= FLIP_RADIUS_H * Math.sin(angle) * Math.cos(hr); fz += FLIP_RADIUS_V * (1 - Math.cos(angle)); }
          let pitch = 0, roll = 0;
          if (dir === 'back') pitch = FLIP_PITCH_MAX * Math.sin(angle);
          else if (dir === 'forward') pitch = -FLIP_PITCH_MAX * Math.sin(angle);
          else if (dir === 'left') roll = FLIP_PITCH_MAX * Math.sin(angle);
          else roll = -FLIP_PITCH_MAX * Math.sin(angle);
          state.positions.push(pos(fx, fy, fz, state.heading, pitch, roll));
        }
        if (dir === 'back') { state.x -= FLIP_RADIUS_H * 2 * Math.cos(hr); state.y -= FLIP_RADIUS_H * 2 * Math.sin(hr); }
        else if (dir === 'forward') { state.x += FLIP_RADIUS_H * 2 * Math.cos(hr); state.y += FLIP_RADIUS_H * 2 * Math.sin(hr); }
        else if (dir === 'left') { state.x -= FLIP_RADIUS_H * 2 * Math.sin(hr); state.y += FLIP_RADIUS_H * 2 * Math.cos(hr); }
        else { state.x += FLIP_RADIUS_H * 2 * Math.sin(hr); state.y -= FLIP_RADIUS_H * 2 * Math.cos(hr); }
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        dur = numPoints * DT;
        break;
      }
      case 'go': {
        const dir = p.dir || 'forward';
        const power = parseFloat(p.power) || 50;
        dur = parseFloat(p.dur) || 1;
        const speed = (power / 100) * DEFAULT_SPEED * 2;
        const steps = Math.max(Math.ceil(dur / DT), 5);
        const hr = state.heading * Math.PI / 180;
        let dx = 0, dy = 0, pitch = 0, roll = 0;
        const pf = power / 100;
        if (dir === 'forward') { dx = Math.cos(hr); dy = Math.sin(hr); pitch = -MAX_PITCH * pf; }
        else if (dir === 'backward') { dx = -Math.cos(hr); dy = -Math.sin(hr); pitch = MAX_PITCH * pf; }
        else if (dir === 'left') { dx = -Math.sin(hr); dy = Math.cos(hr); roll = MAX_ROLL * pf; }
        else { dx = Math.sin(hr); dy = -Math.cos(hr); roll = -MAX_ROLL * pf; }
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          let ease = 1;
          if (t < 0.2) ease = t / 0.2;
          else if (t > 0.8) ease = (1 - t) / 0.2;
          state.positions.push({ x: state.x + dx * speed * dur * t, y: state.y + dy * speed * dur * t, z: state.z, heading: state.heading, pitch: pitch * ease, roll: roll * ease });
        }
        state.x += dx * speed * dur;
        state.y += dy * speed * dur;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'move_forward':
      case 'move_backward': {
        const dist = (parseFloat(p.dist) || 50) / 100;
        const power = parseFloat(p.power) || 50;
        const sign = cmd.type === 'move_forward' ? 1 : -1;
        const pf = power / 100;
        const speed = pf * DEFAULT_SPEED * 2;
        const steps = Math.max(Math.ceil(dist / (speed * DT)), 5);
        const hr = state.heading * Math.PI / 180;
        const pitch = sign * MAX_PITCH * pf;
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          let ease = 1;
          if (t < 0.2) ease = t / 0.2;
          else if (t > 0.8) ease = (1 - t) / 0.2;
          state.positions.push({ x: state.x + sign * Math.cos(hr) * dist * t, y: state.y + sign * Math.sin(hr) * dist * t, z: state.z, heading: state.heading, pitch: pitch * ease, roll: 0 });
        }
        state.x += sign * Math.cos(hr) * dist;
        state.y += sign * Math.sin(hr) * dist;
        dur = steps * DT;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'move_left':
      case 'move_right': {
        const dist = (parseFloat(p.dist) || 50) / 100;
        const power = parseFloat(p.power) || 50;
        const pf = power / 100;
        const speed = pf * DEFAULT_SPEED * 2;
        const steps = Math.max(Math.ceil(dist / (speed * DT)), 5);
        const hr = state.heading * Math.PI / 180;
        const roll = cmd.type === 'move_left' ? MAX_ROLL * pf : -MAX_ROLL * pf;
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          const ease = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
          let px, py;
          if (cmd.type === 'move_left') { px = state.x - Math.sin(hr) * dist * t; py = state.y + Math.cos(hr) * dist * t; }
          else { px = state.x + Math.sin(hr) * dist * t; py = state.y - Math.cos(hr) * dist * t; }
          state.positions.push({ x: px, y: py, z: state.z, heading: state.heading, pitch: 0, roll: roll * ease });
        }
        if (cmd.type === 'move_left') { state.x -= Math.sin(hr) * dist; state.y += Math.cos(hr) * dist; }
        else { state.x += Math.sin(hr) * dist; state.y -= Math.cos(hr) * dist; }
        dur = steps * DT;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'turn_left':
      case 'turn_right': {
        const deg = parseFloat(p.deg) || 90;
        const steps = Math.max(Math.ceil(deg / 180 * 10), 5);
        const degFactor = Math.min(deg / 360, 1);
        const rollDir = cmd.type === 'turn_left' ? MAX_ROLL * degFactor : -MAX_ROLL * degFactor;
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          const ease = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
          state.heading += (cmd.type === 'turn_left' ? deg : -deg) / steps;
          state.positions.push({ x: state.x, y: state.y, z: state.z, heading: state.heading, pitch: 0, roll: rollDir * ease });
        }
        dur = deg / 180;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'circle': {
        const steps = 60; const radius = 0.6;
        for (let i = 0; i < steps; i++) {
          const angle = 2 * Math.PI * i / steps;
          state.positions.push({ x: state.x + radius * Math.cos(angle), y: state.y + radius * Math.sin(angle), z: state.z, heading: state.heading, pitch: 0, roll: -MAX_ROLL * 0.8 * Math.sin(angle) });
        }
        state.x += radius;
        dur = 3;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'square': {
        const side = 0.6; const stepsPerSide = 15;
        const hr = state.heading * Math.PI / 180;
        const dirs = [[Math.cos(hr), Math.sin(hr)], [-Math.sin(hr), Math.cos(hr)], [-Math.cos(hr), -Math.sin(hr)], [Math.sin(hr), -Math.cos(hr)]];
        const sidePitch = [-MAX_PITCH * 0.6, 0, MAX_PITCH * 0.6, 0];
        const sideRoll = [0, -MAX_ROLL * 0.6, 0, MAX_ROLL * 0.6];
        for (let si = 0; si < dirs.length; si++) {
          const [ddx, ddy] = dirs[si];
          for (let i = 0; i < stepsPerSide; i++) {
            const t = (i + 1) / stepsPerSide;
            const ease = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
            state.positions.push({ x: state.x + ddx * side * t, y: state.y + ddy * side * t, z: state.z, heading: state.heading, pitch: sidePitch[si] * ease, roll: sideRoll[si] * ease });
          }
          state.x += ddx * side; state.y += ddy * side;
        }
        dur = 4;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }
      case 'triangle': {
        const side = 0.6; const stepsPerSide = 15;
        const hr = state.heading * Math.PI / 180;
        for (let i = 0; i < 3; i++) {
          const angle = hr + i * (2 * Math.PI / 3);
          const ddx = Math.cos(angle), ddy = Math.sin(angle);
          for (let j = 0; j < stepsPerSide; j++) {
            const t = (j + 1) / stepsPerSide;
            const ease = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
            state.positions.push({ x: state.x + ddx * side * t, y: state.y + ddy * side * t, z: state.z, heading: state.heading, pitch: -MAX_PITCH * 0.6 * ease, roll: 0 });
          }
          state.x += ddx * side; state.y += ddy * side;
        }
        dur = 4;
        state.positions.push(pos(state.x, state.y, state.z, state.heading, 0, 0));
        break;
      }

      case 'led': {
        state.ledColor = p.color || 'green';
        state.positions.push({ x: state.x, y: state.y, z: state.z, heading: state.heading, pitch: 0, roll: 0, led: state.ledColor });
        dur = 0.1;
        break;
      }
      case 'buzzer': { dur = parseFloat(p.dur) || 0.5; break; }
      case 'random_led': {
        const colors = ['red','green','blue','yellow','cyan','magenta','white','purple','orange','pink'];
        state.ledColor = colors[Math.floor(Math.random() * colors.length)];
        state.positions.push({ x: state.x, y: state.y, z: state.z, heading: state.heading, pitch: 0, roll: 0, led: state.ledColor });
        dur = 0.1;
        break;
      }

      case 'var_declare': { vars[p.name] = evalExpr(p.value, vars); dur = 0; break; }
      case 'set_var': {
        const val = evalExpr(p.value, vars);
        if (p.op === '=') vars[p.name] = val;
        else if (p.op === '+=') vars[p.name] = (vars[p.name] || 0) + val;
        else if (p.op === '-=') vars[p.name] = (vars[p.name] || 0) - val;
        else if (p.op === '*=') vars[p.name] = (vars[p.name] || 0) * val;
        else if (p.op === '/=') vars[p.name] = val !== 0 ? (vars[p.name] || 0) / val : 0;
        dur = 0;
        break;
      }
      case 'print_var': { dur = 0; break; }

      case 'if_block': {
        const cond = evalExpr(p.condition, vars);
        if (cond) processCommands(cmd.children || [], vars, state, maxIter);
        dur = 0;
        break;
      }
      case 'elif_block': {
        const cond = evalExpr(p.condition, vars);
        if (cond) processCommands(cmd.children || [], vars, state, maxIter);
        dur = 0;
        break;
      }
      case 'else_block': {
        processCommands(cmd.children || [], vars, state, maxIter);
        dur = 0;
        break;
      }
      case 'end_block': { dur = 0; break; }

      case 'while_block': {
        let loops = 0;
        while (evalExpr(p.condition, vars) && loops < 500) {
          processCommands(cmd.children || [], vars, state, maxIter);
          loops++;
        }
        dur = 0;
        break;
      }
      case 'for_block': {
        const varName = p.var || 'i';
        const start = parseInt(p.start) || 0;
        const endVal = parseInt(p.end_val) || 5;
        const step = parseInt(p.step) || 1;
        if (step === 0) break;
        for (let i = start; step > 0 ? i < endVal : i > endVal; i += step) {
          vars[varName] = i;
          processCommands(cmd.children || [], vars, state, maxIter);
        }
        dur = 0;
        break;
      }
      case 'break_cmd': { dur = 0; break; }

      case 'get_distance': { vars[p.var] = 100; dur = 0; break; }
      case 'get_height': { vars[p.var] = 0.8; dur = 0; break; }
      case 'get_color': { vars[p.var] = 'green'; dur = 0; break; }
      case 'get_battery': { vars[p.var] = 80; dur = 0; break; }
      case 'get_temperature': { vars[p.var] = 22; dur = 0; break; }

      case 'func_def': {
        vars['__func_' + p.name] = cmd.children || [];
        dur = 0;
        break;
      }
      case 'func_call': {
        const body = vars['__func_' + p.name];
        if (body) processCommands(body, vars, state, maxIter);
        dur = 0;
        break;
      }
      case 'return_val': { dur = 0; break; }

      case 'list_declare': {
        vars[p.name] = (p.values || '').split(',').map(v => evalExpr(v.trim(), vars));
        dur = 0;
        break;
      }
      case 'list_append': {
        if (!Array.isArray(vars[p.name])) vars[p.name] = [];
        vars[p.name].push(evalExpr(p.value, vars));
        dur = 0;
        break;
      }
      case 'list_get': {
        const arr = vars[p.list_name];
        vars[p.var] = Array.isArray(arr) ? (arr[parseInt(p.index)] || 0) : 0;
        dur = 0;
        break;
      }

      case 'user_input': { vars[p.var] = 0; dur = 0; break; }
      case 'timer_start': { vars[p.name] = Date.now() / 1000; dur = 0; break; }
      case 'timer_elapsed': { vars[p.var] = (Date.now() / 1000) - (vars[p.name] || 0); dur = 0; break; }
      case 'time_sleep': { dur = parseFloat(p.dur) || 1; break; }
    }

    state.totalDuration += dur || 0;
  }
}

function simulateSingleDrone(drone) {
  const offset = drone.offset || [0, 0, 0];
  const state = {
    x: 0, y: 0, z: 0, heading: 0,
    positions: [pos(offset[0], offset[2], offset[1], 0)],
    totalDuration: 0,
    flying: false,
    ledColor: 'off'
  };
  const vars = {};
  processCommands(drone.commands, vars, state);

  let currentLed = 'off';
  for (const p of state.positions) {
    if (p.led !== undefined) currentLed = p.led;
    else p.led = currentLed;
    p.x += offset[0];
    p.y += offset[2];
    p.z += offset[1];
  }

  return { positions: state.positions, totalDuration: state.totalDuration };
}

export function simulateCommands(commands) {
  return simulateSingleDrone({ commands, offset: [0, 0, 0] });
}

export function simulateSwarm(drones) {
  const results = {};
  let maxDuration = 0;

  for (const drone of drones) {
    const result = simulateSingleDrone(drone);
    results[drone.id] = result;
    if (result.totalDuration > maxDuration) maxDuration = result.totalDuration;
  }

  for (const id of Object.keys(results)) {
    results[id].totalDuration = maxDuration;
  }

  return results;
}
