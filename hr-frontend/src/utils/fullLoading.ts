import { ElLoading } from 'element-plus'

class FullLoadingService {
  private static instance: FullLoadingService
  private loadingInstance: ReturnType<typeof ElLoading.service> | null = null

  private constructor() {}

  public static getInstance(): FullLoadingService {
    if (!FullLoadingService.instance) {
      FullLoadingService.instance = new FullLoadingService()
    }
    return FullLoadingService.instance
  }

  /**
   * 显示全屏 Loading 遮罩
   * @param text 遮罩上显示的文案
   */
  public show(text = '加载中...') {
    // 若已存在，则先关闭，保证单例
    this.hide()

    this.loadingInstance = ElLoading.service({
      fullscreen: true,
      lock: true,
      text,
      background: 'rgba(0, 0, 0, 0.7)',
    })
  }

  /**
   * 更新全屏 Loading 遮罩的文案
   * @param text 遮罩上显示的文案
   */
  public updateText(text: string) {
    if (this.loadingInstance) {
      this.loadingInstance.setText(text)
    }
  }

  /**
   * 关闭全屏 Loading 遮罩
   */
  public hide() {
    if (this.loadingInstance) {
      this.loadingInstance.close()
      this.loadingInstance = null
    }
  }
}

export default FullLoadingService.getInstance()
