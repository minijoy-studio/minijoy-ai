package ai.minijoy.phone

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AssistantAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val prefs = getSharedPreferences("minijoy_phone_ai", MODE_PRIVATE)
        val requested = prefs.getString("pending_exact_click", null) ?: return
        val root = rootInActiveWindow ?: return
        val matches = root.findAccessibilityNodeInfosByText(requested)
        val target = matches.firstOrNull { it.text?.toString() == requested }
        var clickable: AccessibilityNodeInfo? = target
        while (clickable != null && !clickable.isClickable) clickable = clickable.parent
        if (clickable?.isClickable == true) {
            val performed = clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            if (performed) prefs.edit().remove("pending_exact_click").apply()
        }
    }

    override fun onInterrupt() = Unit
}
