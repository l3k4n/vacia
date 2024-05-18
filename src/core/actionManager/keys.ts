const nums = "0123456789".split("");
const letters = "abcdefghijklmnopqrstuvwxyz".split("");
const functionKeys = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);
const special = ["'", ",", "-", ".", "/", ";", "=", "[", "\\", "]", "`"];
const directions = ["down", "left", "right", "up"];
const misc = [
  "backspace",
  "delete",
  "enter",
  "esc",
  "pagedown",
  "pageup",
  "space",
  "tab",
];
const mods = ["alt", "cmd", "command", "control", "ctrl", "shift"];

const allowedKeys = new Set([
  ...mods,
  ...misc,
  ...directions,
  ...special,
  ...functionKeys,
  ...letters,
  ...nums,
]);

function validateKeys(keys: string[]) {
  if(!keys.length) return false;
  return keys.every((key) => allowedKeys.has(key));
}

export { allowedKeys, validateKeys };
