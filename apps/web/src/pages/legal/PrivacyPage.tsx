import { Link } from '@tanstack/react-router';
import foxIcon from '../landing/fox-icon.png';
import styles from './LegalPage.module.css';

export function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link to="/" className={styles.back}>← На главную</Link>

        <div className={styles.header}>
          <Link to="/" className={styles.logoRow}>
            <img src={foxIcon} className={styles.logoIcon} alt="FrenchUp" />
            <span className={styles.logoText}>FrenchUp</span>
          </Link>
          <h1 className={styles.title}>Политика конфиденциальности</h1>
          <p className={styles.updated}>Последнее обновление: 2 мая 2026 г.</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.highlight}>
              Мы серьёзно относимся к вашей конфиденциальности. Этот документ объясняет, какие данные
              собирает FrenchUp, как мы их используем и как вы можете управлять своей информацией.
            </div>
          </div>

          <div className={styles.section}>
            <h2>1. Кто мы</h2>
            <p>
              FrenchUp — образовательный сервис для изучения французского языка, доступный по адресу{' '}
              <a href="https://frenchup.app">frenchup.app</a>. По всем вопросам, связанным с
              конфиденциальностью, пишите на{' '}
              <a href="mailto:the.lord.kraid@gmail.com">the.lord.kraid@gmail.com</a>.
            </p>
          </div>

          <div className={styles.section}>
            <h2>2. Какие данные мы собираем</h2>
            <ul>
              <li>
                <strong>Данные аккаунта:</strong> имя, адрес электронной почты, хешированный пароль
                (мы не храним пароли в открытом виде).
              </li>
              <li>
                <strong>Данные при входе через Google:</strong> имя и email из вашего Google-аккаунта
                (только при использовании OAuth-авторизации).
              </li>
              <li>
                <strong>Данные об обучении:</strong> прогресс по словам, результаты тестов,
                пройденные грамматические темы, статистика упражнений по аудированию, результат
                вступительного теста определения уровня.
              </li>
              <li>
                <strong>Технические данные:</strong> сессионные cookie для поддержания
                авторизованного состояния (refresh-токен). Никаких трекинговых cookie или рекламных
                идентификаторов мы не используем.
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>3. Как мы используем ваши данные</h2>
            <ul>
              <li>Для предоставления сервиса: авторизация, отображение прогресса, персонализация контента.</li>
              <li>Для подбора учебных материалов под ваш уровень (A1–C2).</li>
              <li>Для хранения истории обучения и статистики между сессиями.</li>
              <li>Для связи с вами по вопросам, связанным с аккаунтом (только при необходимости).</li>
            </ul>
            <p style={{ marginTop: 'var(--space-3)' }}>
              Мы <strong>не продаём</strong> ваши данные третьим лицам и не используем их в
              рекламных целях.
            </p>
          </div>

          <div className={styles.section}>
            <h2>4. Передача данных третьим лицам</h2>
            <ul>
              <li>
                <strong>Railway (railway.app):</strong> хостинг-провайдер, на серверах которого
                работает база данных и API. Railway расположен в США и соответствует стандартам
                безопасности данных.
              </li>
              <li>
                <strong>Google OAuth:</strong> используется только для альтернативного входа. Мы
                получаем только имя и email. На Google распространяется их собственная{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Политика конфиденциальности
                </a>.
              </li>
            </ul>
            <p style={{ marginTop: 'var(--space-3)' }}>
              Иным третьим лицам ваши данные не передаются.
            </p>
          </div>

          <div className={styles.section}>
            <h2>5. Хранение и защита данных</h2>
            <ul>
              <li>Все соединения защищены протоколом HTTPS.</li>
              <li>Пароли хранятся в виде хеша (bcrypt) — даже мы не знаем ваш пароль.</li>
              <li>Данные хранятся до тех пор, пока существует ваш аккаунт.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>6. Ваши права</h2>
            <ul>
              <li>
                <strong>Просмотр данных:</strong> вся информация о вашем профиле и прогрессе
                доступна на странице «Профиль».
              </li>
              <li>
                <strong>Изменение данных:</strong> имя и пароль можно изменить в настройках профиля.
              </li>
              <li>
                <strong>Удаление аккаунта:</strong> напишите нам на{' '}
                <a href="mailto:the.lord.kraid@gmail.com">the.lord.kraid@gmail.com</a> — мы удалим
                все ваши данные в течение 30 дней.
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>7. Cookie</h2>
            <p>
              Мы используем только технические cookie, необходимые для работы сервиса: refresh-токен
              для поддержания сессии авторизации. Аналитические, рекламные или сторонние cookie
              не используются.
            </p>
          </div>

          <div className={styles.section}>
            <h2>8. Возрастные ограничения</h2>
            <p>
              FrenchUp предназначен для пользователей старше 13 лет. Мы намеренно не собираем
              данные детей младше этого возраста. Если вы обнаружили подобный аккаунт — пожалуйста,
              сообщите нам.
            </p>
          </div>

          <div className={styles.section}>
            <h2>9. Изменения политики</h2>
            <p>
              При существенных изменениях мы обновим дату вверху страницы. Продолжение использования
              сервиса после обновления означает ваше согласие с новой редакцией.
            </p>
          </div>

          <div className={styles.section}>
            <h2>10. Контакты</h2>
            <p>
              По вопросам конфиденциальности: <a href="mailto:the.lord.kraid@gmail.com">the.lord.kraid@gmail.com</a>
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <Link to="/" className={styles.footerLink}>Главная</Link>
          <a href="/terms" className={styles.footerLink}>Условия использования</a>
        </div>
      </div>
    </div>
  );
}
