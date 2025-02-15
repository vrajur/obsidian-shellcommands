import {CreateShellCommandFieldCore} from "./CreateShellCommandFieldCore";
import ShellCommandsPlugin from "../../main";
import {TShellCommand} from "../../TShellCommand";
import {PlatformId, PlatformNames} from "../ShellCommandsPluginSettings";

export function createPlatformSpecificShellCommandField(plugin: ShellCommandsPlugin, container_element: HTMLElement, t_shell_command: TShellCommand, platform_id: PlatformId) {
    const platform_name = PlatformNames[platform_id];
    const setting_group = CreateShellCommandFieldCore(
        plugin,
        container_element,
        "Shell command on " + platform_name,
        t_shell_command.getPlatformSpecificShellCommands()[platform_id] ?? "",
        t_shell_command.getShell(),
        async (shell_command: string) => {
            if (shell_command.length) {
                // shell_command is not empty, so it's a normal command.
                t_shell_command.getPlatformSpecificShellCommands()[platform_id] = shell_command;
            } else {
                // shell_command is empty, so the default command should be used.
                delete t_shell_command.getPlatformSpecificShellCommands()[platform_id];
            }
            await plugin.saveSettings();
        },
        t_shell_command.getDefaultShellCommand(),
    );
    setting_group.name_setting.setDesc("If empty, the default shell command will be used on " + platform_name + ".");
}