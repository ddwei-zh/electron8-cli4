let path = require('path')
let glob = require('glob') // 用于筛选文件
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');


function resolve(dir) {
  return path.join(__dirname, dir)
}

// 工厂函数 - 配置pages实现多页面获取某文件夹下的html与js
function handleEntry(entry) {
  let entries = {}
  let entryBaseName = ''
  let entryPathName = ''
  let entryTemplate = ''

  glob.sync(entry).forEach(item => {
    console.log('!!!', item)
    entryTemplate = item.split('/').slice(0, 5)
    console.log('entryTemplate:', entryTemplate)


    entryBaseName = entryTemplate[4]
    console.log('entryBaseName:', entryBaseName)

    entryPathName = entryBaseName // 正确输出js和html的路径
    console.log('entryPathName', entryPathName)


    entries[entryPathName] = {
      app: `.\\` + path.join(...entryTemplate, 'main.js'),
      entry: `.\\` + path.join(...entryTemplate, 'main.js'),
      template: `.\\` + path.join(...entryTemplate, 'public', 'index.html'),
      // title: entryPathName,
      filename: entryPathName
    }
  })

  return entries
}

let pages = handleEntry('./src/renderer/pages/**?/public/index.html')
let WebpackRenderer = config => {
  
  config.plugin('define').use(webpack.DefinePlugin, [{
    'process.env': {
      NODE_ENV: '"production"',
      BASE_URL: '`require("electron").remote.app.getAppPath()`',
      IS_ELECTRON: true
    },
    __dirname: '`require("electron").remote.app.getAppPath()`',
    __filename: '`${require("electron").remote.app.getAppPath()}/index.html`',
    __static: '`require("electron").remote.app.getAppPath()`'
  }])

  config.entryPoints.clear() // 会把默认的入口清空
  Object.keys(pages).forEach(entryName => {
    // config.plugin('html').use(HtmlWebpackPlugin, [pages[entryName]])
    config.plugin(`html-${entryName}`).use(HtmlWebpackPlugin, [pages[entryName]])
    config.entry(entryName).add( pages[entryName].entry)
  })

  console.log(config.toString())
}

module.exports = {
  
  configureWebpack: {
    // Configuration applied to all builds
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: config => {
        // Chain webpack config for electron main process only
      },
      chainWebpackRendererProcess: WebpackRenderer,
      // Use this to change the entrypoint of your app's main process
      mainProcessFile: 'src/electron/main.js',
      // Provide an array of files that, when changed, will recompile the main process and restart Electron
      // Your main process file will be added by default
      // mainProcessWatch: ['src/myFile1', 'src/myFile2'],
      
      // [1.0.0-rc.4+] Provide a list of arguments that Electron will be launched with during "electron:serve",
      // which can be accessed from the main process (src/background.js).
      // Note that it is ignored when --debug flag is used with "electron:serve", as you must launch Electron yourself
      // Command line args (excluding --debug, --dashboard, and --headless) are passed to Electron as well
      mainProcessArgs: ['--arg-name', 'arg-value']
    },
    builderOptions: {
      "appId": "com.mybmi.app",
      "productName": "myBMI身体指数计算器",//项目名，也是生成的安装文件名，即aDemo.exe
      "copyright": "Copyright © 2019 柳叶刀",//版权信息
      "directories": {
        "output": "./dist"//输出文件路径
      },
      "asar": true,
      "dmg": {
        "contents": [
          {
            "x": 410,
            "y": 150,
            "type": "link",
            "path": "/Applications"
          },
          {
            "x": 130,
            "y": 150,
            "type": "file"
          }
        ]
      },
      "mac": {
        "icon": "./public/app.icns",
      },
      "win": {//win相关配置
        "icon": "./public/app.ico",//图标，当前图标在根目录下，注意这里有两个坑
        "target": [
          {
            "target": "nsis",//利用nsis制作安装程序
            "arch": [
              "x64",//64位
              "ia32"//32位
            ]
          }
        ]
      },
      "nsis": {
        "oneClick": false, // 是否一键安装
        "allowElevation": true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
        "allowToChangeInstallationDirectory": true, // 允许修改安装目录
        "installerIcon": "./public/app.ico",// 安装图标
        "uninstallerIcon": "./public/app.ico",//卸载图标
        "installerHeaderIcon": "./public/app.ico", // 安装时头部图标
        "createDesktopShortcut": true, // 创建桌面图标
        "createStartMenuShortcut": true,// 创建开始菜单图标
        "shortcutName": "myBMI", // 图标名称
      },
      "publish": [
        {
          "provider": "generic",
          "url": "http://**.**.**.**:3001/download/",//隐藏版本服务器地址
        }
      ]
    }
  }
}