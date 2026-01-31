export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Configure notifications and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Telegram</h4>
                <p className="text-sm text-gray-500">Instant notifications via Telegram bot</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.TELEGRAM_BOT_TOKEN
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Email</h4>
                <p className="text-sm text-gray-500">Email notifications via SMTP</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.SMTP_HOST
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {process.env.SMTP_HOST ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">SMS</h4>
                <p className="text-sm text-gray-500">Text messages via Twilio</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.TWILIO_ACCOUNT_SID
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Voice Call</h4>
                <p className="text-sm text-gray-500">Voice calls via Twilio (optional)</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.ENABLE_VOICE_CALLS === 'true'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {process.env.ENABLE_VOICE_CALLS === 'true' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Monitoring Configuration</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Check Interval</span>
            <span className="font-semibold">{process.env.CHECK_INTERVAL_MINUTES || 5} minutes</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Screenshot Directory</span>
            <span className="font-semibold text-sm">{process.env.SCREENSHOT_DIR || './data/screenshots'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Log Level</span>
            <span className="font-semibold">{process.env.LOG_LEVEL || 'info'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
