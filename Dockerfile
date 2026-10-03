FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY be/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY be/ ./
COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint

RUN chmod 0755 /usr/local/bin/backend-entrypoint \
    && mkdir -p /app/staticfiles \
    && useradd --create-home --uid 10001 app \
    && chown -R app:app /app /usr/local/bin/backend-entrypoint

USER app
EXPOSE 8000

ENTRYPOINT ["backend-entrypoint"]
CMD ["sh", "-c", "exec gunicorn --bind=0.0.0.0:${PORT:-8000} --workers=2 --access-logfile=- --error-logfile=- be.wsgi:application"]
