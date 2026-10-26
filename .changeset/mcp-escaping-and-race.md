---
'@youj/mcp': patch
---

Security: generated text is escaped for where it lands. `create_theme` writes brand names and other strings into the theme's code with backslashes, quotes and line breaks escaped, so they read back as given and cannot end the string early. Props tables escape a backslash before a pipe, so it cannot end a cell. `get_project_info` reads each project file through the handle it checked and confirms the path still leads to that file inside the app, so a link swapped in during the read is not followed.
