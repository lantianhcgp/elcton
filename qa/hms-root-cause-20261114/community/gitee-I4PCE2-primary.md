# Gitee I4PCE2 原始 API 正文与评论

URL: https://gitee.com/hms-core/hms-wear-engine-demo/issues/I4PCE2

标题: 获取不到绑定的设备

创建: 2022-01-04T18:16:32+08:00

更新: 2024-09-28T14:32:56+08:00

状态: open

正文作者: qhs1573

## 正文

按照例子我导入到AS之后替换了我自己的申请的包名和APP_ID 然后我运行后log信息如下请问我哪里没整对
这里的包名我脱敏处理了
2022-01-04 18:08:56.511 24043-24043/xx.xxx.xxx D/WearEngineMainActivity: getAuthClient onSuccess
2022-01-04 18:08:56.731 24043-24082/xx.xxx.xxx D/WearEngineMainActivity: getAuthClient onOk notify
2022-01-04 18:08:56.731 24043-24082/xx.xxx.xxx D/WearEngineMainActivity: getAuthClient onOk device_manager
2022-01-04 18:08:56.731 24043-24082/xx.xxx.xxx D/WearEngineMainActivity: getAuthClient onOk sensor
2022-01-04 18:08:56.768 24043-24043/xx.xxx.xxx D/WearEngineMainActivity: hasAvailableDevices onSuccess
//获取绑定的设备这里一直会失败异常如下
onFailure
com.huawei.wearengine.WearEngineException: Scope unauthorized

手机端使用的是华为P30 升级到鸿蒙2.0系统了  穿戴设备端用的是GT2_PRO，运动健康能力开发下我的App 权限已经打开
Wear Engine申请已经通过

## 评论（API完整核对4条，第2页空）

### 8168058 | mikemei | 2022-01-05T14:52:30+08:00

1. 请确保手机在进行开发测试时已连网。
2. 可参考华为开发者联盟以下网址FAQ中的“接口调用时返回 Scope unauthorized 错误信息”进行排查处理。
https://developer.huawei.com/consumer/cn/doc/development/connectivity-Guides/faq-0000001050818031#section59621722810
3.如仍有问题，请参考FAQ排查指导中的在线提单，华为开发者联盟在1-2个工作日内回复您的问题

### 10812637 | qhs1573 | 2022-06-09T09:00:44+08:00

后来搞定了，怎么搞定的忘记了 :smile: 

### 25835092 | meishijuhe | 2024-03-20T11:13:10+08:00

怎么申请WearEngine服务啊? 申请老是被驳回   没有申请成功是不是也搜不到设备?

### 32510979 | nihuye | 2024-09-28T14:32:56+08:00

同问

