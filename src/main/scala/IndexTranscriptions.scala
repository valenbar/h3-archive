package com.snacktrace.archive

import akka.actor.ActorSystem
import cats.implicits._
import com.sksamuel.elastic4s.ElasticClient
import com.sksamuel.elastic4s.ElasticDsl._
import com.sksamuel.elastic4s.akka.{AkkaHttpClient, AkkaHttpClientSettings}
import io.circe.parser.decode
import akka.stream.Materializer
import com.snacktrace.archive.IndexPodcast.eventsIndex
import com.snacktrace.archive.model.{EventDoc, LinkType, TranscriptionDoc}
import com.typesafe.config.ConfigFactory
import io.circe.syntax._

import java.nio.file.Files
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, Future, blocking}
import scala.sys.process._
import scala.util.{Failure, Success}

object IndexTranscriptions {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: Materializer = Materializer.createMaterializer(system)

  def main(args: Array[String]): Unit = {
    val settings = Settings.fromConfig(ConfigFactory.load())
    implicit val dispatcher: ExecutionContext = system.dispatcher

    val elasticsearchClient = ElasticClient(
      AkkaHttpClient(
        AkkaHttpClientSettings.default.copy(
          https = true,
          hosts = Vector(settings.elasticsearch.host),
          username = Some(settings.elasticsearch.writeUser),
          password = Some(settings.elasticsearch.writePassword)
        )
      )
    )

    val fut = for {
      hits <- elasticsearchClient.execute {
        search(eventsIndex).sourceExclude(List("transcription.*")).size(1000)
      }
      esEvents = hits.result.hits.hits.toList.flatMap { hit =>
        decode[EventDoc](hit.sourceAsString).toTry match {
          case Success(event) =>
            List(event)
          case Failure(exception) =>
            println("Failed to deserialize doc")
            exception.printStackTrace()
            Nil
        }
      }
      filteredEvents = esEvents
        .filter(_.transcription.isEmpty)
        .filter(_.links.exists(_.exists(_.`type` === LinkType.YouTube.name)))
        .sortBy(e => e.startDate)
      paralleEc = ExecutionContext.fromExecutorService(new java.util.concurrent.ForkJoinPool(6))
      _ <- filteredEvents.map(ev => transcribe(elasticsearchClient, settings)(ev)(paralleEc).attempt).sequence
    } yield ()
    Await.result(fut, 60.hours)
  }

  def transcribe(elasticClient: ElasticClient, settings: Settings)(esEvent: EventDoc)(
      implicit
      ec: ExecutionContext
  ): Future[Unit] = {
    val mp3FileOutput = Files.createTempFile(esEvent.eventId, ".mp3")
    mp3FileOutput.toFile.delete()
    val jsonFileOutput = Files.createTempFile(esEvent.eventId, ".json")
    jsonFileOutput.toFile.delete()
    for {
      _ <- Future {
        blocking {
          println(s"Outputting mp3 to ${mp3FileOutput.toFile.getAbsolutePath}")
          println(s"Outputting json to ${jsonFileOutput.toFile.getAbsolutePath}")
          val maybeYtLink = esEvent.links.flatMap(ls => ls.find(_.`type` === LinkType.YouTube.name)).map(_.url)
          val maybeBin = settings.transcription.flatMap(_.bin)
          (maybeYtLink, maybeBin) match {
            case (Some(ytLink), Some(bin)) =>
              val command =
                s"""${bin} ${ytLink} ${mp3FileOutput.toFile.getAbsolutePath} ${jsonFileOutput.toFile.getAbsolutePath}"""
              println(s"Executing command:\n${command}")
              Process(command).!
            case _ =>
              0
          }
        }
      }
      contents <- Future {
        scala.io.Source.fromFile(jsonFileOutput.toFile).getLines().mkString("\n")
      }
      transcriptionDoc <- Future.fromTry(decode[TranscriptionDoc](contents).toTry)
      updatedDoc = esEvent.copy(transcription = Some(transcriptionDoc))
      _ = println(updatedDoc)
      _ <- elasticClient
        .execute {
          indexInto(eventsIndex).withId(updatedDoc.eventId).doc(updatedDoc.asJson.toString())
        }
        .map(_ => ())
    } yield ()
  }
}
