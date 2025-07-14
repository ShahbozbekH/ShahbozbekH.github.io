// Credit to https://github.com/lustre-labs/lustre

// IMPORTS ---------------------------------------------------------------------

import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/uri.{type Uri}
import lustre
import lustre/attribute.{type Attribute}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html

// Modem is a package providing effects and functionality for routing in SPAs.
// This means instead of links taking you to a new page and reloading everything,
// they are intercepted and your `update` function gets told about the new URL.
import modem

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

// MODEL -----------------------------------------------------------------------

type Model {
  Model(posts: Dict(Int, Post), route: Route)
}

type Post {
  Post(id: Int, title: String, summary: String, text: String)
}

/// In a real application, we'll likely want to show different views depending on
/// which URL we are on:
///
/// - /      - show the home page
/// - /posts - show a list of posts
/// - /about - show an about page
/// - ...
///
/// We could store the `Uri` or perhaps the path as a `String` in our model, but
/// this can be awkward to work with and error prone as our application grows.
///
/// Instead, we _parse_ the URL into a nice Gleam custom type with just the
/// variants we need! This lets us benefit from Gleam's pattern matching,
/// exhaustiveness checks, and LSP features, while also serving as documentation
/// for our app: if you can get to a page, it must be in this type!
///
type Route {
  Index
  Posts
  PostById(id: Int)
  About
  Resume
  /// It's good practice to store whatever `Uri` we failed to match in case we
  /// want to log it or hint to the user that maybe they made a typo.
  NotFound(uri: Uri)
}

fn parse_route(uri: Uri) -> Route {
  case uri.path_segments(uri.path) {
    [] | [""] -> Index

    ["posts"] -> Posts

    ["post", post_id] ->
      case int.parse(post_id) {
        Ok(post_id) -> PostById(id: post_id)
        Error(_) -> NotFound(uri:)
      }

    ["about"] -> About

    _ -> NotFound(uri:)
  }
}

/// We also need a way to turn a Route back into a an `href` attribute that we
/// can then use on `html.a` elements. It is important to keep this function in
/// sync with the parsing, but once you do, all links are guaranteed to work!
///
fn href(route: Route) -> Attribute(msg) {
  let url = case route {
    Index -> "/"
    About -> "https://github.com/ShahbozbekH"
    Posts -> "https://www.linkedin.com/in/shahbozhakimov/"
    Resume ->
      "https://shahbozbekh.github.io/priv/static/media/HakimovShahbozbek.pdf"
    PostById(post_id) -> "/post/" <> int.to_string(post_id)
    NotFound(_) -> "/404"
  }

  attribute.href(url)
}

fn init(_) -> #(Model, Effect(Msg)) {
  // The server for a typical SPA will often serve the application to *any*
  // HTTP request, and let the app itself determine what to show. Modem stores
  // the first URL so we can parse it for the app's initial route.
  let route = case modem.initial_uri() {
    Ok(uri) -> parse_route(uri)
    Error(_) -> Index
  }

  let posts =
    posts
    |> list.map(fn(post) { #(post.id, post) })
    |> dict.from_list

  let model = Model(route:, posts:)

  let effect =
    // We need to initialise modem in order for it to intercept links. To do that
    // we pass in a function that takes the `Uri` of the link that was clicked and
    // turns it into a `Msg`.
    modem.init(fn(uri) {
      uri
      |> parse_route
      |> UserNavigatedTo
    })

  #(model, effect)
}

// UPDATE ----------------------------------------------------------------------

type Msg {
  UserNavigatedTo(route: Route)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserNavigatedTo(route:) -> #(Model(..model, route:), effect.none())
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("mx-auto max-w-3xl")], [
    html.nav([attribute.class("flex justify-center items-center my-16")], [
      html.h1(
        [attribute.class("text-black-600 size-auto font-normal text-4xl")],
        [
          html.a([href(Index)], [html.text("Shahbozbek Hakimov")]),
          html.ul([attribute.class("flex justify-center space-x-8 text-xl")], [
            html.div(
              [attribute.class("text-blue-600 border-b-2 border-blue-600")],
              [
                view_header_link(
                  current: model.route,
                  to: Posts,
                  label: "LinkedIn",
                ),
              ],
            ),
            html.div(
              [attribute.class("text-black-600 border-b-2 border-black-600")],
              [
                view_header_link(
                  current: model.route,
                  to: About,
                  label: "Github",
                ),
              ],
            ),
          ]),
          html.a(
            [
              attribute.class(
                "mx-auto flex justify-center max-w-9 mt-4 items-center animate-[spin_3s_linear_infinite]",
              ),
            ],
            [
              html.img([
                attribute.src(
                  "http://shahbozbekh.github.io/priv/static/media/8star.png",
                ),
              ]),
            ],
          ),
          html.a(
            [
              attribute.class(
                "mx-auto flex justify-center max-w-9 items-center rotate-[-38deg]",
              ),
            ],
            [
              html.img([
                attribute.src(
                  "http://shahbozbekh.github.io/priv/static/media/crescent.png",
                ),
              ]),
            ],
          ),
        ],
      )
    ]), 
    html.main([attribute.class("my-16")], {
      // Just like we would show different HTML based on some other state in the
      // model, we can also pattern match on our Route value to show different
      // views based on the current page!
      case model.route {
        Index -> view_index()
        Posts -> view_posts(model)
        PostById(post_id) -> view_post(model, post_id)
        Resume -> view_resume()
        About -> view_about()
        NotFound(_) -> view_not_found()
      }
    }), html.div([attribute.class("")], [html.div([attribute.class("absolute top-[2.5px] left-[320.15px] invisible  xl:visible")], [html.text("𐰼")]),
            html.div([attribute.class("absolute -top-[61.5px] left-[174px] rotate-[48deg] invisible xl:visible")],[
            html.div([attribute.class("")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[16px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[30px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[44px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[58px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[72px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[86px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[100px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[114px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[128px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[142px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[156px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[170px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[184px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[198px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[212px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[226px] left-[0.01px]")], [html.text("𐰮")]),
            ]
          ),
          html.div([attribute.class("absolute -top-[61.5px] left-[467.4px] -rotate-[48deg] invisible xl:visible")],[
            html.div([attribute.class("")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[16px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[30px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[44px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[58px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[72px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[86px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[100px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[114px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[128px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[142px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[156px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[170px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[184px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[198px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[212px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[226px] left-[0.01px]")], [html.text("𐰭")]),
            ]
          ),
          html.div([attribute.class("absolute top-[75px] left-[360px] font-bold invisible xl:visible")],[
              html.div([attribute.class("relative left-[1px] top-[26.5px] text-[0.5rem]")], [html.text("")]),
              html.div([attribute.class("relative text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold")],  [html.text("𐰐")]),
              html.div([attribute.class("relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold")], [html.text("𐰐")]),
          ]),
          html.div([attribute.class("absolute top-[75px] left-[280px] font-bold invisible  xl:visible")],[
              html.div([attribute.class("relative left-[1px] top-[26.5px] text-[0.5rem]")], [html.text("")]),
              html.div([attribute.class("relative text-xl font-bold transform scaleX(-1)")], [html.text("𐰐")]),
              html.div([attribute.class("relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold")],  [html.text("𐰐")]),
              html.div([attribute.class("relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold")], [html.text("𐰐")]),
          ]),
          html.div([attribute.class("absolute top-[12px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[22px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[32px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[42px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[52px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[62px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[72px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[82px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[92px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[102px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[112px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[122px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[132px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[142px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[152px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[162px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[172px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[182px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[192px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[202px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[212px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[222px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[232px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[242px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[252px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[262px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[272px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[282px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[292px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[302px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[312px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[322px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[332px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[342px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[352px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[362px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[372px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[382px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[392px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[402px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[412px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[422px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[432px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[442px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[452px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[462px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[472px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[482px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[492px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[502px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[512px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[522px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[532px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[542px] left-[320px] invisible xl:visible")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[546px] left-[320.15px] invisible xl:visible")],[
            html.text("𐰂"),
            html.div([],[
            html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[73.15px] right-[5.15px] -rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[94.15px] right-[5.15px] -rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
            html.div([attribute.class("absolute bottom-[718px] left-[140px] rotate-[180deg]")], [
              html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[74px] right-[4px] -rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[94px] right-[4px] -rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
              ])]),
            
          ]),
          html.div([attribute.class("absolute -top-[148.50px] left-[319.15px] rotate-[180deg] invisible xl:visible")],[
            html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[73px] right-[5px] -rotate-[48deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[93px] right-[5px] -rotate-[132deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
            html.div([attribute.class("absolute bottom-[718px] left-[140px] rotate-[180deg]")], [
              html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[74px] right-[4px] -rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[94px] right-[4px] -rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
              ])
            ]),
            html.div([attribute.class("absolute top-[546px] right-[319px] invisible xl:visible")],[
            html.text("𐰂"),
            html.div([],[
            html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[73.15px] right-[5.15px] -rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[94.15px] right-[5.15px] -rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
            html.div([attribute.class("absolute bottom-[718px] left-[140px] rotate-[180deg]")], [
              html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[74px] right-[4px] -rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[94px] right-[4px] -rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
              ])]),]),
          
          html.div([attribute.class("absolute -top-[148.50px] right-[319.15px] rotate-[180deg] invisible xl:visible")],[
            html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[73px] right-[5px] -rotate-[48deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[93px] right-[5px] -rotate-[132deg]")], [html.text("")]),
            html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
            html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
            html.div([attribute.class("absolute bottom-[718px] left-[140px] rotate-[180deg]")], [
              html.div([attribute.class("relative bottom-[25px] left-[5px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[45px] left-[5px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[74px] right-[4px] -rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[94px] right-[4px] -rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[112.5px] left-[10px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[149.5px] left-[10px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[155.75px] left-[15px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[202px] left-[15px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[199.25px] left-[20px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[254.50px] left-[20px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[242.75px] left-[25px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[306.75px] left-[25px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[286.25px] left-[30px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[359.25px] left-[30px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[329.75px] left-[35px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[411.75px] left-[35px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[373.25px] left-[40px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[464.25px] left-[40px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[416.75px] left-[45px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[516.75px] left-[45px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[460.25px] left-[50px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[569.25px] left-[50px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[503.75px] left-[55px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[621.75px] left-[55px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[547.25px] left-[60px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[674.25px] left-[60px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[590.75px] left-[65px] rotate-[132deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[726.75px] left-[65px] rotate-[48deg]")], [html.text("𐰱")]),
              html.div([attribute.class("relative bottom-[631px] left-[70px] rotate-[180deg]")], [html.text("𐱃")]),
              ])
            ]),

          html.div([attribute.class("absolute top-[518px] left-[191px] rotate-[45deg] text-3xl invisible xl:visible")], [
            html.text("𐰬"),
            html.div([attribute.class("relative bottom-[55px] left-[5px]")],[html.text("𐰼")]),   
            html.div([attribute.class("relative bottom-[50px] right-[5px] rotate-[180deg]")],[html.text("𐰼")]), 
            html.div([attribute.class("relative bottom-[101.5px] left-[22px] rotate-[90deg]")],[html.text("𐰼")]),
            html.div([attribute.class("relative bottom-[147.5px] right-[22px] rotate-[270deg]")],[html.text("𐰼")]),
          ]), 
          html.div([attribute.class("absolute top-[518px] left-[334px] rotate-[45deg] text-3xl invisible xl:visible")], [
            html.text("𐰬"),
            html.div([attribute.class("relative bottom-[55px] left-[5px]")],[html.text("𐰼")]),   
            html.div([attribute.class("relative bottom-[50px] right-[5px] rotate-[180deg]")],[html.text("𐰼")]), 
            html.div([attribute.class("relative bottom-[101.5px] left-[22px] rotate-[90deg]")],[html.text("𐰼")]),
            html.div([attribute.class("relative bottom-[147.5px] right-[22px] rotate-[270deg]")],[html.text("𐰼")]),
          ]), 
          html.div([attribute.class("absolute top-[518px] right-[431px] rotate-[45deg] text-3xl invisible xl:visible")], [
            html.text("𐰬"),
            html.div([attribute.class("relative bottom-[55px] left-[5px]")],[html.text("𐰼")]),   
            html.div([attribute.class("relative bottom-[50px] right-[5px] rotate-[180deg]")],[html.text("𐰼")]), 
            html.div([attribute.class("relative bottom-[101.5px] left-[22px] rotate-[90deg]")],[html.text("𐰼")]),
            html.div([attribute.class("relative bottom-[147.5px] right-[22px] rotate-[270deg]")],[html.text("𐰼")]),
          ]), 
          html.div([attribute.class("absolute top-[518px] right-[291px] rotate-[45deg] text-3xl invisible xl:visible")], [
            html.text("𐰬"),
            html.div([attribute.class("relative bottom-[55px] left-[5px]")],[html.text("𐰼")]),   
            html.div([attribute.class("relative bottom-[50px] right-[5px] rotate-[180deg]")],[html.text("𐰼")]), 
            html.div([attribute.class("relative bottom-[101.5px] left-[22px] rotate-[90deg]")],[html.text("𐰼")]),
            html.div([attribute.class("relative bottom-[147.5px] right-[22px] rotate-[270deg]")],[html.text("𐰼")]),
          ]), 
          html.div([attribute.class("absolute top-[552px] left-[320.15px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[562px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[572px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[582px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[592px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[602px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[612px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[622px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[632px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[642px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[652px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[662px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[672px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[682px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[692px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[702px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[712px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[722px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[732px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[742px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[752px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[762px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[772px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[782px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[792px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[802px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[812px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[822px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[832px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[842px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[852px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[862px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[872px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[882px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[892px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[902px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[912px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[922px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[932px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[942px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[952px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[962px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[972px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[982px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[992px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1002px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1012px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1022px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1032px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1042px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1052px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1062px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1072px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1082px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1092px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1102px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1112px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1122px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1132px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1142px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1152px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1162px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1172px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1182px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1192px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1202px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1212px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1222px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1232px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1242px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1252px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1262px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1272px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1282px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1292px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1302px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1312px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1322px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1332px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1342px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1352px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1362px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1372px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1382px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1392px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1402px] left-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[2.5px] right-[320.15px] invisible  xl:visible")], [html.text("𐰼")]),
          html.div([attribute.class("absolute -top-[61.5px] right-[467.5px] rotate-[48deg] invisible  xl:visible")],[
            html.div([attribute.class("")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[16px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[30px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[44px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[58px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[72px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[86px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[100px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[114px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[128px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[142px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[156px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[170px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[184px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[198px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[212px] left-[0.01px]")], [html.text("𐰮")]),
            html.div([attribute.class("relative -top-[226px] left-[0.01px]")], [html.text("𐰮")]),
            ]
          ),
          html.div([attribute.class("absolute -top-[61.5px] right-[174px] -rotate-[48deg] invisible xl:visible")],[
            html.div([attribute.class("")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[16px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[30px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[44px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[58px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[72px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[86px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[100px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[114px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[128px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[142px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[156px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[170px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[184px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[198px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[212px] left-[0.01px]")], [html.text("𐰭")]),
            html.div([attribute.class("relative -top-[226px] left-[0.01px]")], [html.text("𐰭")]),
            ]
          ),
          html.div([attribute.class("absolute top-[75px] right-[280px] invisible font-bold invisible xl:visible")],[
              html.div([attribute.class("relative left-[1px] top-[26.5px] text-[0.5rem]")], [html.text("")]),
              html.div([attribute.class("relative text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold")],  [html.text("𐰐")]),
              html.div([attribute.class("relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold")], [html.text("𐰐")]),
          ]),
          html.div([attribute.class("absolute top-[75px] right-[360px] invisible font-bold invisible xl:visible")],[
              html.div([attribute.class("relative left-[1px] top-[26.5px] text-[0.5rem]")], [html.text("")]),
              html.div([attribute.class("relative text-xl font-bold transform scaleX(-1)")], [html.text("𐰐")]),
              html.div([attribute.class("relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold")], [html.text("𐰐")]),
              html.div([attribute.class("relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold")],  [html.text("𐰐")]),
              html.div([attribute.class("relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold")], [html.text("𐰐")]),
          ]),
          html.div([attribute.class("absolute top-[12px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[22px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[32px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[42px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[52px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[62px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[72px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[82px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[92px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[102px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[112px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[122px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[132px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[142px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[152px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[162px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[172px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[182px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[192px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[202px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[212px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[222px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[232px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[242px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[252px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[262px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[272px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[282px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[292px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[302px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[312px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[322px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[332px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[342px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[352px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[362px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[372px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[382px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[392px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[402px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[412px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[422px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[432px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[442px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[452px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[462px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[472px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[482px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[492px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[502px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[512px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[522px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[532px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[542px] right-[320px] invisible xl:visible ")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[552px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[562px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[572px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[582px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[592px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[602px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[612px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[622px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[632px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[642px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[652px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[662px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[672px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[682px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[692px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[702px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[712px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[722px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[732px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[742px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[752px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[762px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[772px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[782px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[792px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[802px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[812px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[822px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[832px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[842px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[852px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[862px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[872px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[882px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[892px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[902px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[912px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[922px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[932px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[942px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[952px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[962px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[972px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[982px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[992px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1002px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1012px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1022px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1032px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1042px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1052px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1062px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1072px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1082px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1092px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1102px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1112px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1122px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1132px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1142px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1152px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1162px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1172px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1182px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1192px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1202px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1212px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1222px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1232px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1242px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1252px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1262px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1272px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1282px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1292px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1302px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1312px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1322px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1332px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1342px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1352px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1362px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1372px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1382px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1392px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),
          html.div([attribute.class("absolute top-[1402px] right-[320px] invisible xl:visible rotate-[180deg]")], [html.text("𐰱")]),]),
  ])
}

fn view_resume() -> List(Element(msg)) {
  [
    title("Resume"),
    paragraph("You can find my resume here: "),
    html.a(
      [
        href(Resume),
        attribute.class("text-purple-600 hover:underline cursor-pointer"),
      ],
      [html.text("HakimovShahbozbek.pdf")],
    ),
  ]
}

fn view_header_link(
  to target: Route,
  current current: Route,
  label text: String,
) -> Element(msg) {
  let is_active = case current, target {
    PostById(_), Posts -> True
    _, _ -> current == target
  }

  html.li(
    [
      attribute.classes([
        #("border-transparent border-b-2 hover:border-purple-600", True),
        #("text-purple-600", is_active),
      ]),
    ],
    [html.a([href(target)], [html.text(text)])],
  )
}

// VIEW PAGES ------------------------------------------------------------------

fn view_index() -> List(Element(msg)) {
  [
    html.p([attribute.class("text-sm md:px-32")], [
      html.text(
        "Hello, I'm Shahbozbek Hakimov. This is my personal website for sharing my progress and thoughts. I hope to fill this space with interesting content soon. In the meantime, check out my resume ",
      ),
      link(Resume, "(or click here):"),
    ]),
    html.img([
      attribute.class("mx-auto"),
      attribute.src("http://shahbozbekh.github.io/priv/static/media/0.png"),
    ]),
  ]
}

fn view_posts(model: Model) -> List(Element(msg)) {
  let posts =
    model.posts
    |> dict.values
    |> list.sort(fn(a, b) { int.compare(a.id, b.id) })
    |> list.map(fn(post) {
      html.article([attribute.class("mt-14")], [
        html.h3([attribute.class("text-xl text-purple-600 font-light")], [
          html.a([attribute.class("hover:underline"), href(PostById(post.id))], [
            html.text(post.title),
          ]),
        ]),
        html.p([attribute.class("mt-1")], [html.text(post.summary)]),
      ])
    })

  [title("Posts"), ..posts]
}

fn view_post(model: Model, post_id: Int) -> List(Element(msg)) {
  case dict.get(model.posts, post_id) {
    Error(_) -> view_not_found()
    Ok(post) -> [
      html.article([], [
        title(post.title),
        leading(post.summary),
        paragraph(post.text),
      ]),
      html.p([attribute.class("mt-14")], [link(Posts, "<- Go back?")]),
    ]
  }
}

fn view_about() -> List(Element(msg)) {
  [
    title("Me"),
    paragraph(
      "I document the odd occurrences that catch my attention and rewrite my own
       narrative along the way. I'm fine being referred to with pronouns.",
    ),
    paragraph(
      "If you enjoy these glimpses into my mind, feel free to come back
       semi-regularly. But not too regularly, you creep.",
    ),
  ]
}

fn view_not_found() -> List(Element(msg)) {
  [
    title("Not found"),
    paragraph(
      "You glimpse into the void and see -- nothing?
       Well that was somewhat expected.",
    ),
  ]
}

// VIEW HELPERS ----------------------------------------------------------------

fn title(title: String) -> Element(msg) {
  html.h2([attribute.class("text-3xl text-purple-800 font-light")], [
    html.text(title),
  ])
}

fn leading(text: String) -> Element(msg) {
  html.p([attribute.class("mt-8 text-lg")], [html.text(text)])
}

fn paragraph(text: String) -> Element(msg) {
  html.p([attribute.class("mt-14")], [html.text(text)])
}

/// In other frameworks you might see special `<Link />` components that are
/// used to handle navigation logic. Using modem, we can just use normal HTML
/// `<a>` elements and pass in the `href` attribute. This means we have the option
/// of rendering our app as static HTML in the future!
///
fn link(target: Route, title: String) -> Element(msg) {
  html.a(
    [
      href(target),
      attribute.class("text-purple-600 hover:underline cursor-pointer"),
    ],
    [html.text(title)],
  )
}

// DATA ------------------------------------------------------------------------

const posts: List(Post) = [
  Post(
    id: 1,
    title: "The Empty Chair",
    summary: "A guide to uninvited furniture and its temporal implications",
    text: "
      There's an empty chair in my home that wasn't there yesterday. When I sit
      in it, I start to remember things that haven't happened yet. The chair is
      getting closer to my bedroom each night, though I never caught it move.
      Last night, I dreamt it was watching me sleep. This morning, it offered
      me coffee.
    ",
  ),
  Post(
    id: 2,
    title: "The Library of Unwritten Books",
    summary: "Warning: Reading this may shorten your narrative arc",
    text: "
      Between the shelves in the public library exists a thin space where
      books that were never written somehow exist. Their pages change when you
      blink. Forms shifting to match the souls blueprint. Librarians warn
      against reading the final chapter of any unwritten book – those who do
      find their own stories mysteriously concluding. Yourself is just another
      draft to be rewritten.
    ",
  ),
  Post(
    id: 3,
    title: "The Hum",
    summary: "A frequency analysis of the collective forgetting",
    text: "
      The citywide hum started Tuesday. Not everyone can hear it, but those who
      can't are slowly being replaced by perfect copies who smile too widely.
      The hum isn't sound – it's the universe forgetting our coordinates.
      Reports suggest humming back in harmony might postpone whatever comes
      next. Or perhaps accelerate it.
    ",
  ),
]
