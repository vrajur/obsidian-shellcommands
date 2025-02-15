import {Modal} from "obsidian";
import ShellCommandsPlugin from "../main";
import {ShellCommandSettingGroup} from "./ShellCommandsSettingsTab";
import {TShellCommand} from "../TShellCommand";
import {debugLog} from "../Debug";

export class ShellCommandDeleteModal extends Modal {
    private plugin: ShellCommandsPlugin;
    private readonly shell_command_id: string;
    private readonly t_shell_command: TShellCommand;
    private setting_group: ShellCommandSettingGroup;
    private container_element: HTMLElement;

    constructor(plugin: ShellCommandsPlugin, shell_command_id: string, setting_group: ShellCommandSettingGroup, container_element: HTMLElement) {
        super(plugin.app);
        this.plugin = plugin;
        this.shell_command_id = shell_command_id;
        this.t_shell_command = plugin.getTShellCommands()[shell_command_id];
        this.setting_group = setting_group;
        this.container_element = container_element;
    }

    onOpen() {
        this.modalEl.createEl("h2", {text: "Delete: " + this.t_shell_command.getShellCommand()});
        if (this.t_shell_command.getAlias()) {
            this.modalEl.createEl("p", {text: "Alias: " + this.t_shell_command.getAlias()});
        }
        this.modalEl.createEl("p", {text: "Are you sure you want to delete this shell command?"});
        let delete_button = this.modalEl.createEl("button", {text: "Yes, delete"});
        delete_button.onclick = async () => {
            // Remove the command
            debugLog("Command " + this.shell_command_id + " gonna be removed.");
            delete this.plugin.getTShellCommands()[this.shell_command_id]; // Remove the TShellCommand object.
            delete this.plugin.settings.shell_commands[this.shell_command_id]; // Remove from the plugin's settings.
            delete this.plugin.obsidian_commands[this.shell_command_id]; // Remove from the command palette.

            // Remove the setting fields
            this.container_element.removeChild(this.setting_group.name_setting.settingEl);
            this.container_element.removeChild(this.setting_group.shell_command_setting.settingEl);
            this.container_element.removeChild(this.setting_group.preview_setting.settingEl);

            await this.plugin.saveSettings();
            debugLog("Command removed.");
            this.close();
        };
    }

}