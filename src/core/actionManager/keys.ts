const nums = "0123456789".split("");
const letters = "abcdefghijklmnopqrstuvwxyz".split("");
const functionKeys = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);
const special = ["'", ",", "-", ".", "/", ";", "=", "[", "\\", "]", "`"];
const directions = ["down", "left", "right", "up"];
const misc = [
  "backspace",
  "delete",
  "del",
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

const replacedKeys = {
  control: "ctrl",
  command: "cmd",
  delete: "del",
};

export function validateKey(key: string) {
  return allowedKeys.has(key.toLowerCase());
}

export function formatKey(key: string) {
  if (key.length === 1) return key.toUpperCase();

  if (Object.hasOwn(replacedKeys, key.toLowerCase())) {
    // eslint-disable-next-line no-param-reassign
    key = replacedKeys[key as keyof typeof replacedKeys];
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
}
