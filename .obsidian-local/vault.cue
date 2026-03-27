package obsidian

local: #LocalVault & {
    project:    "obsidian-plugin-cue"
    path:       "~/문서/프로젝트/obsidian-plugin-cue"
    status:     "active"
    created_at: "2026-03-27"
    
    inherit: {
        templates: true
        plugins:   true
        theme:     true
    }
    
    local_folders: ["notes", "docs", "todo"]
    tags: ["obsidian-plugin-cue"]
}
