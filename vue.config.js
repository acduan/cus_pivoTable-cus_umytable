const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
 })
// module.exports = {
//   configureWebpack: {
//     resolve: {
//       fallback: {
//         vm: require.resolve('vm-browserify')
//       }
//     }
//   }
// };
// module.exports = {
//   chainWebpack: config => {
//     config.resolve.fallback.set('vm', require.resolve('vm-browserify'));
//   }
// };
// module.exports = {
//   configureWebpack: {
//     resolve: {
//       fallback: {
//         vm: false
//       }
//     }
//   }
// };