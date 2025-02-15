import {addShellCommandVariableInstructions} from "./ShellCommandVariableInstructions";
import {getVaultAbsolutePath} from "../Common";
import {ShellCommandVariable} from "./ShellCommandVariable";

export class ShellCommandVariable_VaultPath extends ShellCommandVariable{
    name = "vault_path";
    generateValue(): string {
        return getVaultAbsolutePath(this.app);
    }
}
addShellCommandVariableInstructions(
    "{{vault_path}}",
    "Gives the Obsidian vault's absolute path from the root of the filesystem. This is the same that is used as a default working directory if you do not define one manually. If you define a working directory manually, this variable won't give you your manually defined directory, it always gives the vault's root directory.",
);