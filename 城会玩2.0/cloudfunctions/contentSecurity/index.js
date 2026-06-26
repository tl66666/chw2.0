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
    return { pass: true, checked: false };
  }

  try {
    await cloud.openapi.security.msgSecCheck({
      content
    });
    return { pass: true, checked: true };
  } catch (err) {
    const info = normalizeSecurityError(err);
    if (info.blocked) {
      return {
        pass: false,
        blocked: true,
        checked: true,
        errorCode: info.code,
        message: '内容包含不适合发布的信息，请修改后再保存'
      };
    }

    return {
      pass: false,
      blocked: false,
      retryable: true,
      checked: false,
      errorCode: info.code,
      error: info.message,
      message: '文字安全校验暂时不可用，请稍后重试'
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

    return { pass: true, checked: true };
  } catch (err) {
    const info = normalizeSecurityError(err);
    if (info.blocked) {
      return {
        pass: false,
        blocked: true,
        checked: true,
        errorCode: info.code,
        message: '图片包含不适合发布的内容，请换一张照片'
      };
    }

    return {
      pass: false,
      blocked: false,
      retryable: true,
      checked: false,
      errorCode: info.code,
      error: info.message,
      message: getImageCheckMessage(info)
    };
  }
}

function normalizeSecurityError(err) {
  const code = err && (err.errCode || err.errcode || err.code);
  const msg = String((err && (err.errMsg || err.message)) || 'SECURITY_CHECK_FAILED');
  const normalizedCode = String(code || '');
  const blocked = normalizedCode === '87014' || msg.indexOf('87014') !== -1;
  return {
    code: code || 'UNKNOWN',
    message: msg,
    blocked
  };
}

function getImageCheckMessage(info) {
  const msg = String(info.message || '');
  if (msg.indexOf('invalid image size') !== -1 || msg.indexOf('oversize') !== -1) {
    return '图片尺寸或体积过大，请换一张较小的照片再试';
  }
  if (msg.indexOf('permission') !== -1 || msg.indexOf('not authorized') !== -1) {
    return '图片安全接口权限未生效，请重新部署 contentSecurity 云函数';
  }
  return '图片安全校验暂时不可用，请稍后重试';
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
