<style type='text/css'>
img[alt="Logo"]{
    display:block;
    margin: 0 auto;
}
</style>
![Logo](https://d9iixa2xxa0x2.cloudfront.net/i/w_192/1dfba4d3-d72d-5ebb-8674-109e8c61176b.png?urc=4ede23ae-c674-43d1-aecf-410f23349963)
# **Command**
### Set config:
```
    tool set <key> <value1> <value2>
```
### Build module:
```
    tool build module --name <moduleName>
```
### Publish module:
```
    tool publish <scope> <name>
```
### Registry:
+ Add user
    ```
    tool registry adduser <scope>
    ```
# **First Use Or After Update**
```
    tool set basePath <YourRelativePathToYourStoreFolder>
    tool set registry <scope> <url>
```