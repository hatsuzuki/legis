// Global constants
const ARRESTABLE = "May arrest without warrant";
const NONARRESTABLE = "Shall not arrest without warrant";
const BAILABLE = "Bailable";
const NONBAILABLE = "Not bailable";

// Statutes currently supported by the app
// Script will look for and parse JSON file with statute name in /data
const statutes = ["224"];

// Main array to store everything
var data = [];

// Variables to hold Bloodhound objects later
var search_by_offence, search_by_section;


$(document).ready(function()
{   
    // Check if "don't show disclaimer again" cookie was set previously
    // If it wasn't, display the disclaimer
    // (show hidden disclaimer was implemented instead of hiding shown disclaimer to prevent momentary flashing of disclaimer)
    if (document.cookie != "hideDisclaimer=true")
    {
        $("#disclaimer").removeClass("d-none");
        $("#disclaimer-link").addClass("d-none");
    }

    // Iterate through list of statutes and parses JSON files associated with the list names
    // Then appends them to the main data variable
    for (var i=0; i<statutes.length; i++)
    {
        var filepath = "data/" + statutes[i].toString() + ".json";
        $.ajax(
        {
            async   :   false,  // have to set async to false
                                // else initialisers will throw errors
            dataType:   "json",
            url     :   filepath,
        }).done(function(d)
        {
            data = data.concat(d);
        });
    };


    // Initialise first data source (searching by offence name)
    var search_by_offence = new Bloodhound(
    {
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace("offence"),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: data
    });              
    
    // Initialise second data source (searching by section number)
    var search_by_section = new Bloodhound(
    {
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace("section"),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: data
    });

    /**
     * Styles the results of each suggestion to include section number, offence name, and a colour-coded box that indicates the arrestability of the offence
     * Green box with "A" = arrestable
     * Red box with "N" = non-arrestable
     * Yellow box with "?" = depends on predicate 
     * 
     * Style logic is done using a Handlebar hack (see Handlebars.registerHelper() at the bottom of the script)
     */
    var suggestion_template = 
    '<div class="row">' +
    '   <div class="col-3 col-md-2 col-xl-1 section-number my-auto">{{section}}</div>' + 
    '   <div class="col-7 col-md-9 col-xl-10 pl-xl-4 my-auto">{{offence}}</div>' +
    '   <div class="col-2 col-md-1 col-xl-1 text-center my-auto">' + 
    '       {{#iff arrestable "==" "' + ARRESTABLE + '"}}' +
    '           <div class="arrestable-badge-small bg-success font-weight-bold text-white pull-right">A</div>' + 
    '       {{else}}' + 
    '           {{#iff arrestable "==" "' + NONARRESTABLE + '"}}' + 
    '               <div class="arrestable-badge-small bg-danger font-weight-bold text-white pull-right">N</div>' + 
    '           {{else}}' + 
    '               <div class="arrestable-badge-small bg-warning font-weight-bold text-white pull-right">?</div>' +
    '           {{/iff}}' +
    '       {{/iff}}' + 
    '   </div>' + 
    '</div>';
    

    // Initialises the search engine itself using the two data sources and suggestion template
    $("#bloodhound .typeahead").typeahead(
    {
        // Options
        autoselect: true,   // Auto-selects first suggestion
        hint: false,        // Do NOT auto-complete suggested result in the search bar
        highlight: false,   // Highlights matching phrases in the suggestions menu
        minLength: 1,       // Minimum number of characters that must be typed in the
                            // search bar before suggestions will appear
    },
    {
        // First data source (search by offence)
        name: "pc_offence",
        display: "offence",
        source: search_by_offence.ttAdapter(),
        limit: 100,         // Maximum number of suggestions returned
        templates:
        {
            suggestion: Handlebars.compile(suggestion_template)
        }
    },
    {
        // Second data source (search by section)
        name: "pc_section",
        display: "offence",
        source: search_by_section.ttAdapter(),
        limit: 100,         // Maximum number of suggestions returned
        templates:
        {
            suggestion: Handlebars.compile(suggestion_template)
        }
    });
    

    // For mobile devices; makes it so that Autofill suggestions will not appear for the search box
    $(".tt-input").attr("autocomplete", "off");

    
    // If search box contains input, show the clear button
    // else hide the clear button
    $(".typeahead").on("input", function()
    {
        if ($(this).val() !== "")
        {
            $("#searchclear").removeClass("d-none");
            $(this).css("padding-right", "2em");
        }

        else
        {
            $("#searchclear").addClass("d-none");
            $(this).css("padding-right", "15px");
        }
    });

    // Fallback function to also show the clear button once the results menu opens
    $(".typeahead").on("typeahead:open", function()
    {
        if ($(this).val() !== "")
        {
            $("#searchclear").removeClass("d-none");
            $(this).css("padding-right", "2em");
        }
    });


    // Prevent results box from auto-closing on input blur (for mobile devices)
    // Will prevent results box from closing when on-screen keyboard is dismissed
    $(".typeahead").on("typeahead:beforeclose", function(e)
    {
        e.preventDefault();
    });


    // When the clear button is clicked, wipe the search bar and focus on it
    // and close the results box and hide the clear button
    $("#searchclear").on("click", function()
    {
        $(".typeahead").typeahead("val", "").focus();
        $("#result").addClass("d-none");
        $(this).addClass("d-none");
        $(".typeahead").css("padding-right", "15px");
    });
    
    
    // Manually close the suggestion menu and show the results box once a suggestion is selected
    $(".typeahead").on("typeahead:select", function(event, suggestion)
    {    
        // Defocus the search textbox
        $(".typeahead").blur();
        
        // Change padding of search box
        $(".typeahead").css("padding-right", "2em");
        
        // Close the suggestions list
        $(".tt-menu").hide();
        
        // Show the results box
        $("#result").removeClass("d-none");
        
        // Populate the results box
        $("#section").html(suggestion["section"]);
        $("#offence").html(suggestion["offence"]);
        $("#statute").html(suggestion["statute"]);
        $("#statute-name").html(suggestion["statute_name"]);
        $("#arrestable-desc").html(suggestion["arrestable"]);
        $("#punishment").html(suggestion["punishment"]);

        // Replaces bailability description with "Yes" or "No"
        switch (suggestion["bailable"])
        {
            case BAILABLE:
                $("#bailable").html("Yes");
                break;

            case NONBAILABLE:
                $("#bailable").html("No");
                break;

            default:
                $("#bailable").html(suggestion["bailable"]);

        }

        /**
         * Populate and colour the arrestable div and its children accordingly
         * Arrestable:      green with "A"
         * Non-arrestable:  red with "N"
         * Other:           yellow with "?"
         */
        switch (suggestion["arrestable"])
        {
            case ARRESTABLE:
                $("#arrestable").removeClass("div-arrestable div-nonarrestable div-depends").addClass("div-arrestable");
                $("#arrestable-badge").removeClass("bg-success bg-danger bg-warning").addClass("bg-success");
                $("#arrestable-badge").html("A");
                break;

            case NONARRESTABLE:
                $("#arrestable").removeClass("div-arrestable div-nonarrestable div-depends").addClass("div-nonarrestable");
                $("#arrestable-badge").removeClass("bg-success bg-danger bg-warning").addClass("bg-danger");
                $("#arrestable-badge").html("N");
                break;

            default:
                $("#arrestable").removeClass("div-arrestable div-nonarrestable div-depends").addClass("div-depends");
                $("#arrestable-badge").removeClass("bg-success bg-danger bg-warning").addClass("bg-warning");
                $("#arrestable-badge").html("?");
        }

        // Set the AGC button's link properly
        // All statutes' links are hardcoded and unrelated to the statute number itself
        // so we need to do it manually
        if(suggestion["section"])
        {
            $("#agclink").removeClass("d-none");

            switch (suggestion["statute"])
            {
                case ("224"): // Penal Code
                    // Regex removes brackets and their contents in the section number since they are not supported in the listing
                    // so e.g. 304A(b) becomes simply 304A
                    var agclink = suggestion["section"].replace(/ *\([^)]*\) */g, "");
                    $("#agclink").attr("href", "https://sso.agc.gov.sg/Act/PC1871?ProvIds=pr" + agclink + "-" + "#pr" + agclink + "-");
                    break;

                default: // fallback
                    $("#agclink").attr("href", "https://sso.agc.gov.sg");
            }
        }
        else // Else hide the button entirely
        {
            $("#agclink").addClass("d-none");
        }

        // Scroll to top of page
        $("html, body").animate({ scrollTop: 0 });
                            
    });
    
    
    // Show / hide the disclaimer
    $("#disclaimer-link").click(function()
    {
        $("#disclaimer").removeClass("d-none");
        $(this).addClass("d-none");
    });
    
    $(".disclaimer-dismiss").click(function()
    {
        $("#disclaimer").addClass("d-none");
        $("#disclaimer-link").removeClass("d-none");
    });


    // If "don't show again" button was clicked
    // set a cookie to remember not to show disclaimer anymore for up to one year
    $(".disclaimer-dismiss-perm").click(function()
    {
        var cookieDate = new Date;
        cookieDate.setFullYear(cookieDate.getFullYear() + 1);
        document.cookie = "hideDisclaimer=true; expires=" + cookieDate.toUTCString() + ";";
    });
    
});


/*
    Helper to allow the use of logic in Handlebars ("iff" is just shorthand for a function separate from the default "if", NOT the mathematical"if and only if")
    
    Use like this (escape quotes using \ if nested):
    
        {{#iff a '==' b}}
            <code goes here>
        {{else}}
            <code goes here>
        {{/iff}}

    If comparing one variable against a fixed value, use {{#iff a '==' 'value'}} instead
*/
Handlebars.registerHelper("iff", function (v1, operator, v2, options)
{
    switch (operator)
    {
        case "==":
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case "===":
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case "!=":
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case "!==":
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case "<":
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case "<=":
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case ">":
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case ">=":
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case "&&":
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case "||":
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});
