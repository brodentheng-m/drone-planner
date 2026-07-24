export const COMMAND_DEFS = {
  takeoff:        { label: 'Takeoff',        params: [],                                     code: 'drone.takeoff()' },
  land:           { label: 'Land',            params: [],                                     code: 'drone.land()' },
  hover:          { label: 'Hover',           params: [{ key: 'dur', label: 'Secs', type: 'number', default: 1 }], code: (p) => `drone.hover(${p.dur})` },
  flip:           { label: 'Flip',            params: [{ key: 'dir', label: 'Dir', type: 'select', options: ['forward','back','left','right'], default: 'back' }], code: (p) => `drone.flip("${p.dir}")` },
  go:             { label: 'Go',              params: [
    { key: 'dir', label: 'Dir', type: 'select', options: ['forward','backward','left','right','up','down'], default: 'forward' },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 },
    { key: 'dur', label: 'Secs', type: 'number', default: 1, min: 0.1, max: 10 }
  ], code: (p) => `drone.go("${p.dir}", ${p.power}, ${p.dur})` },
  move_forward:   { label: 'Forward',        params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_forward(${p.dist}, ${p.power})` },
  move_backward:  { label: 'Back',            params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_backward(${p.dist}, ${p.power})` },
  move_left:      { label: 'Left',            params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_left(${p.dist}, ${p.power})` },
  move_right:     { label: 'Right',           params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_right(${p.dist}, ${p.power})` },
  move_up:        { label: 'Up',              params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_up(${p.dist}, ${p.power})` },
  move_down:      { label: 'Down',            params: [
    { key: 'dist', label: 'cm', type: 'number', default: 50, min: 10, max: 300 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 0, max: 100 }
  ], code: (p) => `drone.move_down(${p.dist}, ${p.power})` },
  turn_left:      { label: 'Turn Left',       params: [{ key: 'deg', label: 'Deg', type: 'number', default: 90, min: 1, max: 360 }], code: (p) => `drone.turn_left(${p.deg})` },
  turn_right:     { label: 'Turn Right',      params: [{ key: 'deg', label: 'Deg', type: 'number', default: 90, min: 1, max: 360 }], code: (p) => `drone.turn_right(${p.deg})` },
  circle:         { label: 'Circle',          params: [
    { key: 'radius', label: 'Radius cm', type: 'number', default: 50, min: 20, max: 200 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 10, max: 100 }
  ], code: (p) => `drone.circle(${p.radius}, ${p.power})` },
  square:         { label: 'Square',          params: [
    { key: 'size', label: 'Size cm', type: 'number', default: 50, min: 20, max: 200 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 10, max: 100 }
  ], code: (p) => `drone.square(${p.size}, ${p.power})` },
  triangle:       { label: 'Triangle',        params: [
    { key: 'size', label: 'Size cm', type: 'number', default: 50, min: 20, max: 200 },
    { key: 'power', label: 'Power', type: 'number', default: 50, min: 10, max: 100 }
  ], code: (p) => `drone.triangle(${p.size}, ${p.power})` },

  led:            { label: 'LED',             params: [
    { key: 'color', label: 'Color', type: 'select', options: ['red','green','blue','yellow','cyan','magenta','white','purple','orange','pink','off'], default: 'green' }
  ], code: (p) => `drone.set_led("${p.color}")` },
  buzzer:         { label: 'Buzzer',          params: [
    { key: 'freq', label: 'Hz', type: 'number', default: 440, min: 100, max: 5000 },
    { key: 'dur', label: 'Secs', type: 'number', default: 0.5, min: 0.1, max: 5, step: 0.1 }
  ], code: (p) => `drone.set_buzzer(${p.freq}, ${p.dur})` },
  random_led:     { label: 'Random LED',      params: [],                                     code: 'drone.random_color()' },
  drone_sleep:    { label: 'Drone Sleep',     params: [{ key: 'dur', label: 'Secs', type: 'number', default: 1, min: 0.1, max: 10, step: 0.1 }], code: (p) => `drone.sleep(${p.dur})` },

  var_declare:    { label: 'Var',             params: [
    { key: 'name', label: 'Name', type: 'text', default: 'x' },
    { key: 'value', label: 'Value', type: 'text', default: '0' }
  ], code: (p) => `${p.name} = ${p.value}` },
  set_var:        { label: 'Set',             params: [
    { key: 'name', label: 'Name', type: 'text', default: 'x' },
    { key: 'op', label: 'Op', type: 'select', options: ['=', '+=', '-=', '*=', '/='], default: '=' },
    { key: 'value', label: 'Value', type: 'text', default: '1' }
  ], code: (p) => `${p.name} ${p.op} ${p.value}` },
  print_var:      { label: 'Print',           params: [
    { key: 'value', label: 'Value', type: 'text', default: 'x' }
  ], code: (p) => `print(${p.value})` },

  if_block:       { label: 'If',              params: [
    { key: 'condition', label: 'Condition', type: 'text', default: 'x > 0' }
  ], isBlock: true },
  elif_block:     { label: 'Elif',            params: [
    { key: 'condition', label: 'Condition', type: 'text', default: 'x == 0' }
  ], isBlock: true },
  else_block:     { label: 'Else',            params: [], isBlock: true },
  end_block:      { label: 'End',             params: [], code: '' },

  while_block:    { label: 'While',           params: [
    { key: 'condition', label: 'Condition', type: 'text', default: 'True' }
  ], isBlock: true },
  for_block:      { label: 'For Loop',        params: [
    { key: 'var', label: 'Var', type: 'text', default: 'i' },
    { key: 'start', label: 'Start', type: 'number', default: 0 },
    { key: 'end_val', label: 'End', type: 'number', default: 5 },
    { key: 'step', label: 'Step', type: 'number', default: 1 }
  ], isBlock: true },
  break_cmd:      { label: 'Break',           params: [], code: 'break' },

  get_distance:   { label: 'Distance',        params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'dist' }
  ], code: (p) => `${p.var} = drone.get_distance()` },
  get_height:     { label: 'Height',          params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'height' }
  ], code: (p) => `${p.var} = drone.get_height()` },
  get_color:      { label: 'Color Sensor',    params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'color' }
  ], code: (p) => `${p.var} = drone.get_color()` },
  get_battery:    { label: 'Battery',         params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'battery' }
  ], code: (p) => `${p.var} = drone.get_battery()` },
  get_temperature:{ label: 'Temperature',     params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'temp' }
  ], code: (p) => `${p.var} = drone.get_temperature()` },

  func_def:       { label: 'Define Func',     params: [
    { key: 'name', label: 'Name', type: 'text', default: 'my_func' }
  ], isBlock: true },
  func_call:      { label: 'Call Func',       params: [
    { key: 'name', label: 'Name', type: 'text', default: 'my_func' }
  ], code: (p) => `${p.name}()` },
  return_val:     { label: 'Return',          params: [
    { key: 'value', label: 'Value', type: 'text', default: '0' }
  ], code: (p) => `return ${p.value}` },

  list_declare:   { label: 'New List',        params: [
    { key: 'name', label: 'Name', type: 'text', default: 'my_list' },
    { key: 'values', label: 'Values', type: 'text', default: '1, 2, 3' }
  ], code: (p) => `${p.name} = [${p.values}]` },
  list_append:    { label: 'Append',          params: [
    { key: 'name', label: 'List', type: 'text', default: 'my_list' },
    { key: 'value', label: 'Value', type: 'text', default: '0' }
  ], code: (p) => `${p.name}.append(${p.value})` },
  list_get:       { label: 'Get Index',       params: [
    { key: 'list_name', label: 'List', type: 'text', default: 'my_list' },
    { key: 'index', label: 'Index', type: 'text', default: '0' },
    { key: 'var', label: 'Store in', type: 'text', default: 'val' }
  ], code: (p) => `${p.var} = ${p.list_name}[${p.index}]` },

  user_input:     { label: 'Input',           params: [
    { key: 'var', label: 'Store in', type: 'text', default: 'user_val' },
    { key: 'prompt', label: 'Prompt', type: 'text', default: 'Enter value: ' }
  ], code: (p) => `${p.var} = input("${p.prompt}")` },

  timer_start:    { label: 'Start Timer',     params: [
    { key: 'name', label: 'Name', type: 'text', default: 't' }
  ], code: (p) => `${p.name} = time.time()` },
  timer_elapsed:  { label: 'Get Elapsed',     params: [
    { key: 'name', label: 'Timer', type: 'text', default: 't' },
    { key: 'var', label: 'Store in', type: 'text', default: 'elapsed' }
  ], code: (p) => `${p.var} = time.time() - ${p.name}` },

  time_sleep:     { label: 'Sleep',           params: [
    { key: 'dur', label: 'Secs', type: 'number', default: 1, min: 0.1, max: 30, step: 0.1 }
  ], code: (p) => `time.sleep(${p.dur})` }
};

export function createCommand(type) {
  const def = COMMAND_DEFS[type];
  if (!def) return null;
  const params = {};
  for (const p of def.params) {
    params[p.key] = p.default;
  }
  const cmd = { id: crypto.randomUUID(), type, params };
  if (def.isBlock) cmd.children = [];
  return cmd;
}

export function getCommandCode(cmd) {
  const def = COMMAND_DEFS[cmd.type];
  if (!def) return '';
  if (typeof def.code === 'function') return def.code(cmd.params);
  return def.code;
}

export function getCommandLabel(cmd) {
  return COMMAND_DEFS[cmd.type]?.label || cmd.type;
}

export function getCommandParams(cmd) {
  const def = COMMAND_DEFS[cmd.type];
  if (!def || def.params.length === 0) return '';
  return Object.entries(cmd.params).map(([k, v]) => `${k}=${v}`).join(', ');
}

export function isBlockCommand(cmd) {
  return COMMAND_DEFS[cmd.type]?.isBlock || false;
}

export function createDefaultPlan() {
  return {
    name: 'Untitled Flight Plan',
    drones: [
      { id: crypto.randomUUID(), name: 'Drone 1', color: '#58a6ff', commands: [], offset: [0, 0, 0] }
    ],
    activeDroneId: null
  };
}

export function getActiveDrone(plan) {
  return plan.drones.find(d => d.id === plan.activeDroneId) || plan.drones[0];
}

export function getActiveCommands(plan) {
  const drone = getActiveDrone(plan);
  return drone ? drone.commands : [];
}

export const DRONE_COLORS = ['#58a6ff', '#3fb950', '#f0883e', '#bc8cff', '#39d2c0', '#f778ba', '#d29922', '#f85149'];

export function addDrone(plan) {
  const idx = plan.drones.length;
  const color = DRONE_COLORS[idx % DRONE_COLORS.length];
  const drone = {
    id: crypto.randomUUID(),
    name: `Drone ${idx + 1}`,
    color,
    commands: [],
    offset: [0, 0, 0]
  };
  plan.drones.push(drone);
  plan.activeDroneId = drone.id;
  return drone;
}

export function removeDrone(plan, droneId) {
  if (plan.drones.length <= 1) return false;
  const idx = plan.drones.findIndex(d => d.id === droneId);
  if (idx === -1) return false;
  plan.drones.splice(idx, 1);
  if (plan.activeDroneId === droneId) {
    plan.activeDroneId = plan.drones[0].id;
  }
  return true;
}

export function duplicateDrone(plan, droneId) {
  const src = plan.drones.find(d => d.id === droneId);
  if (!src) return null;
  const idx = plan.drones.length;
  const color = DRONE_COLORS[idx % DRONE_COLORS.length];
  const drone = {
    id: crypto.randomUUID(),
    name: src.name + ' Copy',
    color,
    commands: JSON.parse(JSON.stringify(src.commands)),
    offset: [...src.offset]
  };
  plan.drones.push(drone);
  plan.activeDroneId = drone.id;
  return drone;
}

export function setFormation(plan, type, count) {
  while (plan.drones.length < count) {
    addDrone(plan);
  }
  while (plan.drones.length > count) {
    removeDrone(plan, plan.drones[plan.drones.length - 1].id);
  }

  const spacing = 0.5;

  plan.drones.forEach((drone, i) => {
    switch (type) {
      case 'line':
        drone.offset = [(i - (count - 1) / 2) * spacing, 0, 0];
        break;
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const row = Math.floor(i / cols);
        const col = i % cols;
        drone.offset = [(col - (cols - 1) / 2) * spacing, 0, (row - Math.floor((count - 1) / cols) / 2) * spacing];
        break;
      }
      case 'circle': {
        const angle = (i / count) * Math.PI * 2;
        const radius = count * spacing / (2 * Math.PI);
        drone.offset = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
        break;
      }
      case 'v':
        drone.offset = [
          (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * spacing * 0.7,
          0,
          -Math.ceil(i / 2) * spacing * 0.5
        ];
        break;
      case 'column':
        drone.offset = [0, 0, (i - (count - 1) / 2) * spacing];
        break;
      case 'arc': {
        const a = (i / (count - 1 || 1) - 0.5) * Math.PI;
        drone.offset = [Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5 + 1.5];
        break;
      }
      default:
        drone.offset = [0, 0, 0];
    }
  });
}
