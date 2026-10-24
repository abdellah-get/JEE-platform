# Multi-stage build — Java 21 / Spring Boot
# From repo root or backend/:
#   docker build -t jee-platform-api -f backend/Dockerfile backend
#   docker run --rm -p 8081:8081 \
#     -e SPRING_PROFILES_ACTIVE=prod \
#     -e JWT_SECRET=... -e DATABASE_URL=... ...

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw

COPY src src
RUN ./mvnw -B -DskipTests package \
	&& cp target/jee-platform-*.jar /workspace/app.jar

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/* \
	&& groupadd --system spring \
	&& useradd --system --gid spring spring

COPY --from=build /workspace/app.jar /app/app.jar
RUN chown spring:spring /app/app.jar

USER spring:spring

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
	CMD curl -fsS "http://127.0.0.1:${PORT:-8081}/api/v1/health" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
