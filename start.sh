#!/bin/bash

# 1. 백엔드 실행
echo "🚀 백엔드 시작..."
cd ~/Nangjanggo/backend
docker compose up -d

# 2. Cloudflare 터널 실행 & URL 파싱
echo "🌐 Cloudflare 터널 시작..."
if [ ! -f /tmp/cloudflared ]; then
  echo "⬇️ cloudflared 다운로드 중..."
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared && chmod +x /tmp/cloudflared
fi
/tmp/cloudflared tunnel --url http://localhost:8080 2>&1 | while read line; do
  echo "$line"
  if [[ "$line" =~ (https://[a-zA-Z0-9-]+\.trycloudflare\.com) ]]; then
    URL="${BASH_REMATCH[1]}"
    echo "✅ URL 감지: $URL"
    # 3. .env 업데이트
    sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$URL|" ~/Nangjanggo/frontend/.env
    echo "✅ .env 업데이트 완료"
    # 4. 프론트 실행
    echo "📱 프론트 시작..."
    cd ~/Nangjanggo/frontend && npx expo start --tunnel &
    break
  fi
done

# 터널 계속 유지
wait
