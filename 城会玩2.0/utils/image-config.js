/**
 * 图片资源统一配置
 *
 * 所有云存储图片已迁移至 GitHub + jsDelivr CDN
 * 替换原来的 cloud:// 地址
 *
 * 如果 CDN 地址变更，只需修改此文件的 CDN_BASE 即可
 */

// jsDelivr CDN 基础路径
// 格式: https://cdn.jsdelivr.net/gh/{GitHub用户名}/{仓库名}@{分支}/
var CDN_BASE = 'https://cdn.jsdelivr.net/gh/tl66666/chw2.0@main/assets';

// 省份/城市风景图路径
function getCityImage(provinceId) {
  return CDN_BASE + '/cities/' + provinceId + '.jpg';
}

// 角色卡插画路径
function getCardImage(provinceId) {
  return CDN_BASE + '/cards/' + provinceId + '.jpg';
}

// 批量获取城市图片URL
function getCityImages(provinceIds) {
  var result = {};
  for (var i = 0; i < provinceIds.length; i++) {
    result[provinceIds[i]] = getCityImage(provinceIds[i]);
  }
  return result;
}

// 批量获取角色卡图片URL
function getCardImages(provinceIds) {
  var result = {};
  for (var i = 0; i < provinceIds.length; i++) {
    result[provinceIds[i]] = getCardImage(provinceIds[i]);
  }
  return result;
}

module.exports = {
  CDN_BASE: CDN_BASE,
  getCityImage: getCityImage,
  getCardImage: getCardImage,
  getCityImages: getCityImages,
  getCardImages: getCardImages
};
