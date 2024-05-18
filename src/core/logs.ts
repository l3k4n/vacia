export const Errors = {
  UnknownTool(tool: string) {
    return new Error(`VaciaError: Unknown Tool\ntool: '${tool}'`);
  },
  UnknownElement(type: string) {
    return new Error(`VaciaError: Unknown Element\nelement type: '${type}'`);
  },
  UnknownUserMode(mode: string) {
    return new Error(`VaciaError: Unknown Usermode\nusermode: '${mode}'`);
  },
  ImpossibleState(msg: string) {
    return new Error(`VaciaError: Impossible State Reached\n${msg}`);
  },
  DuplicateAction(actionId: string) {
    return new Error(`VaciaError: Multiple actions for id: ${actionId}`);
  },
};
