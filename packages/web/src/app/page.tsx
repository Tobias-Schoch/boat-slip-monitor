import { ChecksRepository, ChangesRepository, MonitoredUrlsRepository } from '@boat-monitor/database';

const urlsRepo = new MonitoredUrlsRepository();
const checksRepo = new ChecksRepository();
const changesRepo = new ChangesRepository();

export default async function HomePage() {
  const urls = await urlsRepo.findAll();
  const recentChecks = await checksRepo.findRecent(10);
  const recentChanges = await changesRepo.findRecent(10);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-600">24/7 monitoring for boat slip waiting list in Konstanz</p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-semibold">Status</div>
            <div className="text-2xl font-bold text-green-700">Online</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-semibold">Monitored URLs</div>
            <div className="text-2xl font-bold text-blue-700">{urls.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 font-semibold">Total Changes</div>
            <div className="text-2xl font-bold text-purple-700">{recentChanges.length}</div>
          </div>
        </div>
      </div>

      {/* Monitored URLs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Monitored URLs</h3>
        <div className="space-y-3">
          {urls.map((url) => (
            <div key={url.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{url.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{url.url}</p>
                  {url.lastChecked && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last checked: {new Date(url.lastChecked).toLocaleString('de-DE')}
                    </p>
                  )}
                </div>
                <div>
                  {url.enabled ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Changes</h3>
        {recentChanges.length > 0 ? (
          <div className="space-y-3">
            {recentChanges.map((change) => (
              <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {change.priority === 'CRITICAL' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                          CRITICAL
                        </span>
                      )}
                      {change.priority === 'IMPORTANT' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          IMPORTANT
                        </span>
                      )}
                      {change.priority === 'INFO' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          INFO
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{change.type}</span>
                    </div>
                    <p className="text-gray-900 mt-2">{change.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(change.detectedAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {Math.round(change.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No changes detected yet</p>
        )}
      </div>

      {/* Recent Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Checks</h3>
        <div className="space-y-2">
          {recentChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                {check.status === 'SUCCESS' ? (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                ) : (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                <span className="text-sm text-gray-600">
                  {new Date(check.checkedAt).toLocaleString('de-DE')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {check.responseTime}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
