const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const fileList = event.fileList || [];

  if (!Array.isArray(fileList) || fileList.length === 0) {
    return {
      success: false,
      error: 'fileList is required. Pass cloud file IDs to inspect access.'
    };
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: fileList.slice(0, 50)
    });
    return {
      success: true,
      data: result.fileList || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error)
    };
  }
};
