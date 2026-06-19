const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const action = event && event.action;

  if (action === 'checkText') {
    return checkText((event && (event.content || event.text)) || '');
  }

  if (action === 'checkImage') {
    return checkImage((event && event.fileID) || '');
  }

  return {
    pass: false,
    error: 'UNKNOWN_ACTION'
  };
};

async function checkText(text) {
  const content = (text || '').trim();
  if (!content) {
    return { pass: true };
  }

  try {
    await cloud.openapi.security.msgSecCheck({
      content
    });
    return { pass: true };
  } catch (err) {
    return {
      pass: false,
      error: err.errCode || err.errMsg || err.message || 'TEXT_SECURITY_FAILED'
    };
  }
}

async function checkImage(fileID) {
  if (!fileID) {
    return { pass: false, error: 'MISSING_FILE_ID' };
  }

  try {
    const file = await cloud.downloadFile({
      fileID
    });

    await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: getImageContentType(fileID),
        value: file.fileContent
      }
    });

    return { pass: true };
  } catch (err) {
    return {
      pass: false,
      error: err.errCode || err.errMsg || err.message || 'IMAGE_SECURITY_FAILED'
    };
  }
}

function getImageContentType(fileID) {
  const lower = String(fileID || '').toLowerCase();
  if (lower.indexOf('.png') !== -1) {
    return 'image/png';
  }
  if (lower.indexOf('.webp') !== -1) {
    return 'image/webp';
  }
  return 'image/jpeg';
}
