import { Scene3D } from './scene/Scene3D.js';
import {
  createCommand, getCommandCode, getCommandLabel,
  getCommandParams, createDefaultPlan, COMMAND_DEFS, isBlockCommand,
  getActiveDrone, getActiveCommands, addDrone, removeDrone, duplicateDrone, setFormation
} from './commands/Commands.js';
import { parseDroneScript } from './commands/ScriptParser.js';
import { generateCoDroneScript, generateSwarmScript, generateAnimationScript } from './codegen/CodeGenerator.js';
import { simulateCommands, simulateSwarm } from './scene/Simulator.js';

const CMD_CATEGORIES = {
  takeoff: 'cat-flight', land: 'cat-flight', hover: 'cat-flight', flip: 'cat-flight',
  go: 'cat-flight', move_forward: 'cat-flight', move_backward: 'cat-flight',
  move_left: 'cat-flight', move_right: 'cat-flight', turn_left: 'cat-flight',
  turn_right: 'cat-flight', circle: 'cat-flight', square: 'cat-flight', triangle: 'cat-flight',
  led: 'cat-output', buzzer: 'cat-output', random_led: 'cat-output', time_sleep: 'cat-output',
  if_block: 'cat-control', elif_block: 'cat-control', else_block: 'cat-control',
  end_block: 'cat-control', while_block: 'cat-control', for_block: 'cat-control', break_cmd: 'cat-control',
  var_declare: 'cat-var', set_var: 'cat-var', print_var: 'cat-var', user_input: 'cat-var',
  get_distance: 'cat-sensor', get_height: 'cat-sensor', get_color: 'cat-sensor',
  get_battery: 'cat-sensor', get_temperature: 'cat-sensor',
  func_def: 'cat-func', func_call: 'cat-func', return_val: 'cat-func',
  list_declare: 'cat-func', list_append: 'cat-func', list_get: 'cat-func',
  timer_start: 'cat-timer', timer_elapsed: 'cat-timer'
};

let plan = createDefaultPlan();
plan.activeDroneId = plan.drones[0].id;
let scene3d;
let selectedPath = null;

function log(msg, type = 'info') {
  const el = document.getElementById('console-output');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'console-line ' + type;
  const ts = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="timestamp">[${ts}]</span>${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function init() {
  const canvas = document.getElementById('scene-canvas');
  scene3d = new Scene3D(canvas);
  scene3d.onPositionUpdate = (x, y, z, heading) => {
    document.getElementById('readout-pos').textContent = `X: ${x.toFixed(2)} Y: ${y.toFixed(2)} Z: ${z.toFixed(2)}`;
    document.getElementById('readout-heading').textContent = `HDG: ${Math.round(heading)}\u00B0`;
  };
  scene3d.onLog = log;

  window.onerror = (msg, src, line, col, err) => {
    log(`Error: ${msg} (${src}:${line}:${col})`, 'error');
  };
  window.addEventListener('unhandledrejection', (e) => {
    log(`Unhandled rejection: ${e.reason}`, 'error');
  });

  document.getElementById('btn-clear-console').addEventListener('click', () => {
    document.getElementById('console-output').innerHTML = '';
  });

  bindToolbar();
  bindModeToggle();
  bindDroneBar();
  bindCommandPalette();
  bindPlayback();
  bindCopyCode();
  renderDroneTabs();
  renderCommandList();
  updateCodePreview();
  refresh();
  log('Drone Planner loaded', 'success');
}

function bindToolbar() {
  document.getElementById('btn-new').addEventListener('click', () => {
    if (confirm('Start a new flight plan? Unsaved changes will be lost.')) {
      plan = createDefaultPlan();
      plan.activeDroneId = plan.drones[0].id;
      selectedPath = null;
      refresh();
      log('New flight plan created');
    }
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    log('Saving flight plan...');
    if (window.electronAPI) {
      await window.electronAPI.saveFile(plan, (plan.name || 'flight') + '.flight');
    } else {
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (plan.name || 'flight') + '.flight';
      a.click();
    }
    log('Flight plan saved', 'success');
  });

  document.getElementById('btn-load').addEventListener('click', async () => {
    log('Loading flight plan...');
    if (window.electronAPI) {
      const result = await window.electronAPI.loadFile();
      if (result.success) {
        if (result.ext === '.py') {
          const cmds = parseDroneScript(result.data);
          const drone = getActiveDrone(plan);
          drone.commands = cmds;
          log(`Imported ${cmds.length} commands into ${drone.name}`, 'success');
        } else {
          plan = JSON.parse(result.data);
          if (!plan.activeDroneId && plan.drones.length > 0) {
            plan.activeDroneId = plan.drones[0].id;
          }
          log(`Loaded flight plan: ${plan.name}`, 'success');
        }
        selectedPath = null;
        refresh();
      } else {
        log('Load cancelled', 'warn');
      }
    } else {
      document.getElementById('py-input').click();
    }
  });

  document.getElementById('py-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (file.name.endsWith('.py')) {
          const cmds = parseDroneScript(ev.target.result);
          const drone = getActiveDrone(plan);
          drone.commands = cmds;
          log(`Imported ${cmds.length} commands from ${file.name}`, 'success');
        } else {
          plan = JSON.parse(ev.target.result);
          if (!plan.activeDroneId && plan.drones.length > 0) {
            plan.activeDroneId = plan.drones[0].id;
          }
          log(`Loaded ${file.name}`, 'success');
        }
        selectedPath = null;
        refresh();
      } catch (err) {
        log(`Error loading file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-import-py').addEventListener('click', () => {
    document.getElementById('py-input').click();
  });

  document.getElementById('btn-export-py').addEventListener('click', async () => {
    const code = generateSwarmScript(plan.drones);
    const name = (plan.name || 'flight') + '.py';
    if (window.electronAPI) {
      await window.electronAPI.exportFile(code, name, 'py');
    } else {
      const blob = new Blob([code], { type: 'text/x-python' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
    }
  });

  document.getElementById('btn-export-single').addEventListener('click', async () => {
    const drone = getActiveDrone(plan);
    const code = generateCoDroneScript(drone.commands);
    const name = (drone.name || 'drone') + '.py';
    if (window.electronAPI) {
      await window.electronAPI.exportFile(code, name, 'py');
    } else {
      const blob = new Blob([code], { type: 'text/x-python' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
    }
  });

  document.getElementById('btn-export-anim').addEventListener('click', async () => {
    const code = generateAnimationScript(getActiveCommands(plan));
    const name = (plan.name || 'flight') + '_sim.py';
    if (window.electronAPI) {
      await window.electronAPI.exportFile(code, name, 'py');
    } else {
      const blob = new Blob([code], { type: 'text/x-python' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
    }
  });

  document.getElementById('plan-name').addEventListener('click', () => {
    const name = prompt('Flight plan name:', plan.name);
    if (name !== null && name.trim()) {
      plan.name = name.trim();
      document.getElementById('plan-name').textContent = plan.name;
    }
  });
}

function bindDroneBar() {
  document.getElementById('btn-add-drone').addEventListener('click', () => {
    const drone = addDrone(plan);
    log(`Added ${drone.name}`);
    selectedPath = null;
    refresh();
  });

  document.getElementById('btn-rm-drone').addEventListener('click', () => {
    if (plan.drones.length <= 1) {
      log('Cannot remove the only drone', 'warn');
      return;
    }
    const drone = getActiveDrone(plan);
    const name = drone.name;
    removeDrone(plan, drone.id);
    log(`Removed ${name}`);
    selectedPath = null;
    refresh();
  });

  document.getElementById('btn-dup-drone').addEventListener('click', () => {
    const drone = getActiveDrone(plan);
    const dup = duplicateDrone(plan, drone.id);
    if (dup) {
      log(`Duplicated ${drone.name} as ${dup.name}`);
      selectedPath = null;
      refresh();
    }
  });

  document.getElementById('formation-select').addEventListener('change', (e) => {
    const type = e.target.value;
    if (!type) return;
    const count = plan.drones.length;
    setFormation(plan, type, count);
    log(`Formation: ${type} (${count} drones)`);
    e.target.value = '';
    refresh();
  });
}

function renderDroneTabs() {
  const tabs = document.getElementById('drone-tabs');
  tabs.innerHTML = '';
  plan.drones.forEach(drone => {
    const tab = document.createElement('div');
    tab.className = 'drone-tab' + (drone.id === plan.activeDroneId ? ' active' : '');
    tab.innerHTML = `<span class="drone-dot" style="background:${drone.color}"></span>${drone.name}<span class="drone-cmd-count">${drone.commands.length}</span>`;
    tab.addEventListener('click', () => {
      plan.activeDroneId = drone.id;
      selectedPath = null;
      refresh();
    });
    tab.addEventListener('dblclick', () => {
      const name = prompt('Rename drone:', drone.name);
      if (name !== null && name.trim()) {
        drone.name = name.trim();
        refresh();
      }
    });
    tabs.appendChild(tab);
  });
}

function bindModeToggle() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function bindCommandPalette() {
  document.querySelectorAll('.cmd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.cmd;
      const cmd = createCommand(type);
      if (cmd) {
        const activeCmds = getActiveCommands(plan);
        if (selectedPath) {
          const target = getCommandByPath(activeCmds, selectedPath);
          if (target && isBlockCommand(target) && target.children) {
            target.children.push(cmd);
          } else {
            activeCmds.push(cmd);
            selectedPath = null;
          }
        } else {
          activeCmds.push(cmd);
        }
        log(`Added: ${getCommandLabel(cmd)}`);
        refresh();
      }
    });
  });
}

function bindPlayback() {
  document.getElementById('btn-play').addEventListener('click', () => {
    const total = plan.drones.reduce((s, d) => s + d.commands.length, 0);
    log(`Play - ${plan.drones.length} drone(s), ${total} commands`);
    scene3d.setSwarm(plan.drones);
    scene3d.play();
  });

  document.getElementById('btn-stop').addEventListener('click', () => {
    scene3d.stop();
    log('Playback stopped', 'warn');
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    scene3d.reset();
    log('Playback reset');
  });

  document.getElementById('playback-speed').addEventListener('input', (e) => {
    const s = parseFloat(e.target.value);
    scene3d.setSpeed(s);
    document.getElementById('speed-label').textContent = s.toFixed(1) + 'x';
  });
}

function bindCopyCode() {
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    const code = plan.drones.length > 1
      ? generateSwarmScript(plan.drones)
      : generateCoDroneScript(getActiveCommands(plan));
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('btn-copy-code');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });

  document.getElementById('btn-apply-code').addEventListener('click', () => {
    const code = document.getElementById('code-output').value;
    try {
      const commands = parseDroneScript(code);
      const activeDrone = getActiveDrone(plan);
      if (activeDrone) {
        activeDrone.commands = commands;
        refresh();
        logMessage('Code applied successfully!', 'success');
      }
    } catch (e) {
      logMessage(`Error applying code: ${e.message}`, 'error');
    }
  });
}

function getCommandByPath(commands, path) {
  let current = commands;
  for (let i = 0; i < path.length - 1; i++) {
    const idx = path[i];
    if (!current[idx] || !current[idx].children) return null;
    current = current[idx].children;
  }
  return current[path[path.length - 1]] || null;
}

function removeFromPath(commands, path) {
  if (path.length === 1) {
    commands.splice(path[0], 1);
    return;
  }
  const parent = getCommandByPath(commands, path.slice(0, -1));
  if (parent && parent.children) {
    parent.children.splice(path[path.length - 1], 1);
  }
}

function renderCommandList() {
  const list = document.getElementById('command-list');
  list.innerHTML = '';
  const drone = getActiveDrone(plan);
  const panel = document.querySelector('#command-list-panel h3');
  if (panel) panel.textContent = `${drone.name} Commands`;
  renderCommandsRecursive(drone.commands, list, 0, []);
}

function renderCommandsRecursive(commands, container, depth, parentPath) {
  commands.forEach((cmd, idx) => {
    const path = [...parentPath, idx];
    const isBlock = isBlockCommand(cmd);
    const cat = CMD_CATEGORIES[cmd.type] || '';
    const isSelected = selectedPath && pathsEqual(selectedPath, path);

    const item = document.createElement('div');
    item.className = `cmd-item ${cat}`;
    if (isBlock) item.classList.add('block-open');
    if (isSelected) item.classList.add('selected');

    const num = depth === 0 ? idx + 1 : `${parentPath.join('.')}.${idx}`;

    item.innerHTML = `
      <span class="cmd-num">${num}</span>
      <span class="cmd-name">${getCommandLabel(cmd)}</span>
      <span class="cmd-params">${isSelected ? '' : getCommandParams(cmd)}</span>
      <span class="cmd-actions">
        <button class="cmd-up" title="Move up" ${idx === 0 ? 'disabled' : ''}>&#x25B2;</button>
        <button class="cmd-down" title="Move down" ${idx === commands.length - 1 ? 'disabled' : ''}>&#x25BC;</button>
        <button class="cmd-delete" title="Delete">&#x2715;</button>
      </span>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.cmd-actions')) return;
      if (e.target.closest('.cmd-inline-edit')) return;
      selectedPath = path;
      renderCommandList();
    });

    item.querySelector('.cmd-up').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx > 0) {
        [commands[idx - 1], commands[idx]] = [commands[idx], commands[idx - 1]];
        if (selectedPath && pathsEqual(selectedPath, path)) {
          selectedPath = [...parentPath, idx - 1];
        }
        refresh();
      }
    });

    item.querySelector('.cmd-down').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx < commands.length - 1) {
        [commands[idx + 1], commands[idx]] = [commands[idx], commands[idx + 1]];
        if (selectedPath && pathsEqual(selectedPath, path)) {
          selectedPath = [...parentPath, idx + 1];
        }
        refresh();
      }
    });

    item.querySelector('.cmd-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPath(getActiveCommands(plan), path);
      selectedPath = null;
      refresh();
    });

    container.appendChild(item);

    if (isSelected) {
      const def = COMMAND_DEFS[cmd.type];
      if (def && def.params.length > 0) {
        const editRow = document.createElement('div');
        editRow.className = 'cmd-inline-edit';
        for (const paramDef of def.params) {
          const field = document.createElement('div');
          field.className = 'cmd-inline-field';
          const lbl = document.createElement('label');
          lbl.textContent = paramDef.label;

          let el;
          if (paramDef.type === 'select') {
            el = document.createElement('select');
            for (const opt of paramDef.options) {
              const option = document.createElement('option');
              option.value = opt;
              option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
              el.appendChild(option);
            }
            el.value = cmd.params[paramDef.key] || paramDef.default;
            el.addEventListener('change', () => {
              cmd.params[paramDef.key] = el.value;
              updateCodePreview();
              renderCommandList();
            });
          } else if (paramDef.type === 'text') {
            el = document.createElement('input');
            el.type = 'text';
            el.value = cmd.params[paramDef.key] || paramDef.default;
            el.addEventListener('input', () => {
              cmd.params[paramDef.key] = el.value;
              updateCodePreview();
            });
            el.addEventListener('blur', () => renderCommandList());
          } else {
            el = document.createElement('input');
            el.type = 'number';
            el.value = cmd.params[paramDef.key] ?? paramDef.default;
            if (paramDef.min !== undefined) el.min = paramDef.min;
            if (paramDef.max !== undefined) el.max = paramDef.max;
            if (paramDef.step) el.step = paramDef.step;
            el.addEventListener('input', () => {
              cmd.params[paramDef.key] = parseFloat(el.value) || paramDef.default;
              updateCodePreview();
            });
            el.addEventListener('blur', () => renderCommandList());
          }

          lbl.appendChild(el);
          field.appendChild(lbl);
          editRow.appendChild(field);
        }
        container.appendChild(editRow);
      }
    }

    if (isBlock && cmd.children) {
      const childContainer = document.createElement('div');
      childContainer.className = 'cmd-block-children';
      renderCommandsRecursive(cmd.children, childContainer, depth + 1, path);
      container.appendChild(childContainer);

      const addBar = document.createElement('div');
      addBar.className = 'cmd-block-add';
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add';
      addBtn.addEventListener('click', () => {
        selectedPath = path;
        showCmdOptions(null);
        log(`Select a command to add inside ${getCommandLabel(cmd)}`);
      });
      addBar.appendChild(addBtn);
      container.appendChild(addBar);
    }
  });
}

function pathsEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function showCmdOptions(cmd) {
  const container = document.getElementById('dynamic-options');
  container.innerHTML = '';
  if (!cmd) return;

  const def = COMMAND_DEFS[cmd.type];
  if (!def || def.params.length === 0) return;

  for (const paramDef of def.params) {
    const label = document.createElement('label');
    label.textContent = paramDef.label + ': ';

    let el;
    if (paramDef.type === 'select') {
      el = document.createElement('select');
      for (const opt of paramDef.options) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        el.appendChild(option);
      }
      el.value = cmd.params[paramDef.key] || paramDef.default;
      el.addEventListener('change', () => {
        cmd.params[paramDef.key] = el.value;
        updateCodePreview();
        renderCommandList();
      });
    } else if (paramDef.type === 'text') {
      el = document.createElement('input');
      el.type = 'text';
      el.value = cmd.params[paramDef.key] || paramDef.default;
      el.addEventListener('input', () => {
        cmd.params[paramDef.key] = el.value;
        updateCodePreview();
        renderCommandList();
      });
    } else {
      el = document.createElement('input');
      el.type = 'number';
      el.value = cmd.params[paramDef.key] ?? paramDef.default;
      if (paramDef.min !== undefined) el.min = paramDef.min;
      if (paramDef.max !== undefined) el.max = paramDef.max;
      if (paramDef.step) el.step = paramDef.step;
      el.addEventListener('input', () => {
        cmd.params[paramDef.key] = parseFloat(el.value) || paramDef.default;
        updateCodePreview();
        renderCommandList();
      });
    }

    label.appendChild(el);
    container.appendChild(label);
  }
}

function updateCodePreview() {
  let code;
  if (plan.drones.length > 1) {
    code = generateSwarmScript(plan.drones);
  } else {
    code = generateCoDroneScript(getActiveCommands(plan));
  }
  const codeOutput = document.getElementById('code-output');
  codeOutput.value = code;
}

function refresh() {
  renderDroneTabs();
  renderCommandList();
  updateCodePreview();
  document.getElementById('plan-name').textContent = plan.name || 'Untitled Flight Plan';

  const sim = simulateSwarm(plan.drones);
  scene3d.setSwarm(plan.drones);
}

document.addEventListener('DOMContentLoaded', init);
