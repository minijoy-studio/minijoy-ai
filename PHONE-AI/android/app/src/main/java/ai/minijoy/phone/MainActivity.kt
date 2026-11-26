package ai.minijoy.phone

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("minijoy_phone_ai", MODE_PRIVATE) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (18 * resources.displayMetrics.density).toInt()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad * 2, pad, pad)
            setBackgroundColor(0xFF0B1220.toInt())
        }
        fun text(value: String, size: Float, color: Int = 0xFFFFFFFF.toInt()) =
            TextView(this).apply { text = value; textSize = size; setTextColor(color); setPadding(0, pad / 2, 0, pad / 2) }
        root.addView(text("MINIJOY PHONE AI", 26f, 0xFF8BC5FF.toInt()))
        root.addView(text("Помощник для твоих проектов", 16f, 0xFFB9C7DA.toInt()))
        root.addView(text("MINIJOY AI  •  FLIXO AI  •  1000 кармильцы", 14f))
        root.addView(text("Доступность Android", 18f, 0xFF8BC5FF.toInt()))
        root.addView(text("Сервис специальных возможностей включается только тобой в настройках Android. Он не передаёт экран или данные в интернет.", 14f, 0xFFB9C7DA.toInt()))
        val settings = Button(this).apply {
            text = "Открыть настройки специальных возможностей"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        }
        root.addView(settings, ViewGroup.LayoutParams(-1, -2))
        root.addView(text("Одноразовое действие по точному тексту", 18f, 0xFF8BC5FF.toInt()))
        root.addView(text("Введи точную надпись кнопки на экране. После подтверждения помощник попробует нажать её один раз. Не используй это для платежей, удаления данных или ввода паролей.", 14f, 0xFFB9C7DA.toInt()))
        val target = EditText(this).apply {
            hint = "Например: Save"
            setSingleLine(true)
            setTextColor(0xFFFFFFFF.toInt())
            setHintTextColor(0xFF8A9BB3.toInt())
        }
        root.addView(target, ViewGroup.LayoutParams(-1, -2))
        val execute = Button(this).apply {
            text = "Подготовить одноразовый клик"
            setOnClickListener {
                val value = target.text.toString().trim()
                if (value.isBlank()) {
                    Toast.makeText(this@MainActivity, "Сначала введи точный текст кнопки", Toast.LENGTH_SHORT).show()
                } else {
                    prefs.edit().putString("pending_exact_click", value).apply()
                    Toast.makeText(this@MainActivity, "Команда подготовлена. Переключись в нужное приложение; помощник выполнит один точный клик, если найдёт совпадение.", Toast.LENGTH_LONG).show()
                }
            }
        }
        root.addView(execute, ViewGroup.LayoutParams(-1, -2))
        root.addView(text("Безопасность: нет фонового управления, записи экрана, чтения сообщений, доступа к паролям или автоматических платежей. Любое действие можно отменить, очистив команду ниже.", 12f, 0xFF91A4BE.toInt()))
        val cancel = Button(this).apply {
            text = "Отменить ожидающее действие"
            setOnClickListener {
                prefs.edit().remove("pending_exact_click").apply()
                Toast.makeText(this@MainActivity, "Ожидающее действие отменено", Toast.LENGTH_SHORT).show()
            }
        }
        root.addView(cancel, ViewGroup.LayoutParams(-1, -2))
        setContentView(root)
    }
}
