# jieba_fast 的纯 Python 替身：jieba_fast 要现场编译 C 扩展（本机编译链和 SDK 不匹配编不过），
# 接口与 jieba 相同，GPT-SoVITS 只用到 setLogLevel / posseg.lcut / lcut / add_word，慢一点但结果一致。
from jieba import *  # noqa: F401,F403
from jieba import setLogLevel  # noqa: F401
