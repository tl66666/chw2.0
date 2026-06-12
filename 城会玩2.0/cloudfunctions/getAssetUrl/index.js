const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const fileID = event.fileID;

  if (!fileID || typeof fileID !== 'string') {
    return { success: false, error: 'fileID is required' };
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    const item = result.fileList && result.fileList[0];

    if (item && item.status === 0 && item.tempFileURL) {
      return {
        success: true,
        fileID,
        url: item.tempFileURL
      };
    }

    return {
      success: false,
      fileID,
      error: item ? item.errMsg || ('status ' + item.status) : 'empty fileList',
      raw: result
    };
  } catch (error) {
    return {
      success: false,
      fileID,
      error: error.message || String(error)
    };
  }
};
