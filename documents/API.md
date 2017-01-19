# API Doc

POST /load-test

```{json}
{
  name: "",
  workflow:["NAME_OF_KEY", ""],
  commandSet: {
    key: {
      name: "",
      binPath: "PATH/TO/COMMAND_TOOL",
      args: ["", ""],
      type: "beforeRun|run|afterRun"
    }
  }
}
```
