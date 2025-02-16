import {App, PluginSettingTab, Setting} from "obsidian";
import ShellCommandsPlugin from "../main";
import {getVaultAbsolutePath} from "../Common";
import {getShellCommandVariableInstructions} from "../variables/ShellCommandVariableInstructions";
import {createShellSelectionField} from "./setting_elements/CreateShellSelectionField";
import {createShellCommandField} from "./setting_elements/CreateShellCommandField";
import {createTabs, TabStructure} from "./setting_elements/Tabs";
import {debugLog} from "../Debug";
import {DocumentationMainLink, DocumentationVariablesLink, GitHubLink} from "../Documentation";

export class ShellCommandsSettingsTab extends PluginSettingTab {
    plugin: ShellCommandsPlugin;

    private tab_structure: TabStructure;

    constructor(app: App, plugin: ShellCommandsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let {containerEl} = this;

        containerEl.empty();

        this.tab_structure = createTabs(containerEl, {
            "main-shell-commands": {
                title: "Shell commands",
                icon: "run-command",
                content_generator: (container_element: HTMLElement) => {
                    this.tabShellCommands(container_element);
                },
            },
            "main-operating-systems-and-shells": {
                title: "Operating systems & shells",
                icon: "stacked-levels",
                content_generator: (container_element: HTMLElement) => {
                    this.tabOperatingSystemsAndShells(container_element);
                },
            },
            "main-output": {
                title: "Output",
                icon: "lines-of-text",
                content_generator: (container_element: HTMLElement) => {
                    this.tabOutput(container_element);
                },
            },
        });

        // Documentation link & GitHub link
        containerEl.createEl("p").insertAdjacentHTML("beforeend",
            "<a href=\"" + DocumentationMainLink + "\">Documentation</a> - " +
            "<a href=\"" + GitHubLink + "\">SC on GitHub</a>",
        );

        // KEEP THIS AFTER CREATING ALL ELEMENTS:
        this.rememberLastPosition(containerEl);
    }

    private tabShellCommands(container_element: HTMLElement) {
        // A <div> element for all command input fields. New command fields can be created at the bottom of this element.
        let command_fields_container = container_element.createEl("div");

        // Fields for modifying existing commands
        for (let command_id in this.plugin.getTShellCommands()) {
            createShellCommandField(this.plugin, command_fields_container, command_id);
        }

        // "New command" button
        new Setting(container_element)
            .addButton(button => button
                .setButtonText("New command")
                .onClick(async () => {
                    createShellCommandField(this.plugin, command_fields_container, "new");
                    debugLog("New empty command created.");
                })
            )
        ;

        // "Variables" section
        container_element.createEl("h2", {text: "Variables"});

        // "Preview variables in command palette" field
        new Setting(container_element)
            .setName("Preview variables in command palette")
            .setDesc("If on, variable names are substituted with their realtime values when you view your commands in the command palette. A nice way to ensure your commands will use correct values.")
            .addToggle(checkbox => checkbox
                .setValue(this.plugin.settings.preview_variables_in_command_palette)
                .onChange(async (value: boolean) => {
                    debugLog("Changing preview_variables_in_command_palette to " + value);
                    this.plugin.settings.preview_variables_in_command_palette = value;
                    if (!value) {
                        // Variable previewing is turned from on to off.
                        // This means that the command palette may have old, stale variable data in it (if a user has opened the palette, but closed it without executing anything).
                        // Remove old, preparsed variable data and reset shell commands' names in the command palette.
                        this.plugin.resetPreparsedShellCommandConfigurations();
                        this.plugin.resetCommandPaletteNames();
                    }
                    await this.plugin.saveSettings();
                })
            )
        ;

        // Variable instructions
        container_element.createEl("p").insertAdjacentHTML("beforeend", "<a href=\"" + DocumentationVariablesLink + "\">See these instructions also in external documentation</a>");
        getShellCommandVariableInstructions().forEach((instructions) => {
            let paragraph = container_element.createEl("p");
            // @ts-ignore
            paragraph.createEl("strong", {text: instructions.variable_name + " "});
            // @ts-ignore
            paragraph.createEl("span", {text: instructions.instructions});
        });
        container_element.createEl("p", {text: "When you type variables into commands, a preview text appears under the command field to show how the command will look like when it gets executed with variables substituted with their real values."});
        container_element.createEl("p", {text: "Special characters in variable values are tried to be escaped (except if you use CMD as the shell in Windows). This is to improve security so that a variable won't accidentally cause bad things to happen. If you want to use a raw, unescaped value, add an exclamation mark before the variable's name, e.g. {{!title}}, but be careful, it's dangerous!"});
        container_element.createEl("p", {text: "There is no way to prevent variable parsing. If you need {{ }} characters in your command, they won't be parsed as variables as long as they do not contain any of the variable names listed below. If you would need to pass e.g. {{title}} literally to your command, there is no way to do it atm, please raise an issue in GitHub."});
        container_element.createEl("p", {text: "All variables that access the current file, may cause the command preview to fail if you had no file panel active when you opened the settings window - e.g. you had focus on graph view instead of a note = no file is currently active. But this does not break anything else than the preview."});
    }

    private tabOperatingSystemsAndShells(container_element: HTMLElement) {
        // "Working directory" field
        new Setting(container_element)
            .setName("Working directory")
            .setDesc("A directory where your commands will be run. If empty, defaults to your vault's location. Can be relative (= a folder in the vault) or absolute (= complete from filesystem root).")
            .addText(text => text
                .setPlaceholder(getVaultAbsolutePath(this.app))
                .setValue(this.plugin.settings.working_directory)
                .onChange(async (value) => {
                    debugLog("Changing working_directory to " + value);
                    this.plugin.settings.working_directory = value;
                    await this.plugin.saveSettings();
                })
            )
        ;

        // Platforms' default shells
        createShellSelectionField(this.plugin, container_element, this.plugin.settings.default_shells, true);
    }

    private tabOutput(container_element: HTMLElement) {
        // "Error message duration" field
        this.createNotificationDurationField(container_element, "Error message duration", "Concerns messages about failed shell commands.", "error_message_duration");

        // "Notification message duration" field
        this.createNotificationDurationField(container_element, "Notification message duration", "Concerns informational, non fatal messages, e.g. output directed to 'Notification balloon'.", "notification_message_duration");

        // "Output channel 'Clipboard' displays a notification message, too" field
        new Setting(container_element)
            .setName("Output channel 'Clipboard' displays a notification message, too")
            .setDesc("If a shell command's output is directed to the clipboard, also show the output in a popup box on the top right corner. This helps to notice what was inserted into clipboard.")
            .addToggle(checkbox => checkbox
                .setValue(this.plugin.settings.output_channel_clipboard_also_outputs_to_notification)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.output_channel_clipboard_also_outputs_to_notification = value;
                    await this.plugin.saveSettings();
                }),
            )
        ;
    }

    createNotificationDurationField(container_element: HTMLElement, title: string, description: string, setting_name: "error_message_duration" | "notification_message_duration") {
        new Setting(container_element)
            .setName(title)
            .setDesc(description + " In seconds, between 1 and 180.")
            .addText(field => field
                .setValue(String(this.plugin.settings[setting_name]))
                .onChange(async (duration_string: string) => {
                    let duration: number = parseInt(duration_string);
                    if (duration >= 1 && duration <= 180) {
                        debugLog("Change " + setting_name + " from " + this.plugin.settings[setting_name] + " to " + duration);
                        this.plugin.settings[setting_name] = duration;
                        await this.plugin.saveSettings();
                        debugLog("Changed.");
                    }
                    // Don't show a notice if duration is not between 1 and 180, because this function is called every time a user types in this field, so the value might not be final.
                })
            )
        ;
    }

    private last_position: {
        scroll_position: number;
        tab_name: string;
    } = {
        scroll_position: 0,
        tab_name: "main-shell-commands",
    };
    private rememberLastPosition(container_element: HTMLElement) {
        const last_position = this.last_position;

        // Go to last position now
        this.tab_structure.buttons[last_position.tab_name].click();
        container_element.scrollTo({
            top: this.last_position.scroll_position,
            behavior: "auto",
        });

        // Listen to changes
        container_element.addEventListener("scroll", (event) => {
            this.last_position.scroll_position = container_element.scrollTop;
        });
        for (let tab_name in this.tab_structure.buttons) {
            let button = this.tab_structure.buttons[tab_name];
            button.onClickEvent((event: MouseEvent) => {
                last_position.tab_name = tab_name;
            });
        }
    }
}

export interface ShellCommandSettingGroup {
    name_setting: Setting;
    shell_command_setting: Setting;
    preview_setting: Setting;
}